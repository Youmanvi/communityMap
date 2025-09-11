package com.example.communitymap.service;

import com.example.communitymap.model.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OverpassService {
    
    private final RestTemplate restTemplate;
    
    @Value("${overpass.api.url:https://overpass-api.de/api/interpreter}")
    private String overpassApiUrl;
    
    public OverpassService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Fetch libraries from OpenStreetMap using Overpass API
     */
    @Cacheable(value = "libraries", key = "#lat + '_' + #lon + '_' + #radiusKm")
    public List<Resource> fetchLibraries(double lat, double lon, double radiusKm) {
        String query = buildLibraryQuery(lat, lon, radiusKm);
        return executeOverpassQuery(query, "LIBRARY");
    }
    
    /**
     * Fetch healthcare facilities from OpenStreetMap using Overpass API
     */
    @Cacheable(value = "healthcare", key = "#lat + '_' + #lon + '_' + #radiusKm")
    public List<Resource> fetchHealthcare(double lat, double lon, double radiusKm) {
        String query = buildHealthcareQuery(lat, lon, radiusKm);
        return executeOverpassQuery(query, "CLINIC");
    }
    
    /**
     * Fetch food assistance resources from OpenStreetMap using Overpass API
     */
    @Cacheable(value = "foodAssistance", key = "#lat + '_' + #lon + '_' + #radiusKm")
    public List<Resource> fetchFoodAssistance(double lat, double lon, double radiusKm) {
        String query = buildFoodAssistanceQuery(lat, lon, radiusKm);
        return executeOverpassQuery(query, "FOOD_BANK");
    }
    
    /**
     * Fetch all community resources from OpenStreetMap using Overpass API
     * Optimized single query approach for better performance
     */
    @Cacheable(value = "allResources", key = "#lat + '_' + #lon + '_' + #radiusKm")
    public List<Resource> fetchAllResources(double lat, double lon, double radiusKm) {
        String query = buildCombinedQuery(lat, lon, radiusKm);
        return executeOverpassQuery(query, "ALL");
    }
    
    private String buildLibraryQuery(double lat, double lon, double radiusKm) {
        return String.format("""
            [out:json][timeout:25];
            (
              node["amenity"="library"](around:%d,%f,%f);
              way["amenity"="library"](around:%d,%f,%f);
              relation["amenity"="library"](around:%d,%f,%f);
            );
            out center;
            """, 
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon
        );
    }
    
    private String buildHealthcareQuery(double lat, double lon, double radiusKm) {
        return String.format("""
            [out:json][timeout:25];
            (
              node["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:%d,%f,%f);
              way["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:%d,%f,%f);
              relation["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:%d,%f,%f);
            );
            out center;
            """, 
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon
        );
    }
    
    private String buildFoodAssistanceQuery(double lat, double lon, double radiusKm) {
        return String.format("""
            [out:json][timeout:25];
            (
              node["amenity"~"^(food_bank|social_facility)$"](around:%d,%f,%f);
              way["amenity"~"^(food_bank|social_facility)$"](around:%d,%f,%f);
              relation["amenity"~"^(food_bank|social_facility)$"](around:%d,%f,%f);
            );
            out center;
            """, 
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon
        );
    }
    
    private String buildCombinedQuery(double lat, double lon, double radiusKm) {
        return String.format("""
            [out:json][timeout:30];
            (
              node["amenity"~"^(library|hospital|clinic|doctors|pharmacy|food_bank|social_facility)$"](around:%d,%f,%f);
              way["amenity"~"^(library|hospital|clinic|doctors|pharmacy|food_bank|social_facility)$"](around:%d,%f,%f);
              relation["amenity"~"^(library|hospital|clinic|doctors|pharmacy|food_bank|social_facility)$"](around:%d,%f,%f);
            );
            out center;
            """, 
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon,
            (int)(radiusKm * 1000), lat, lon
        );
    }
    
    private List<Resource> executeOverpassQuery(String query, String defaultType) {
        try {
            log.info("Executing Overpass query for type: {}", defaultType);
            log.debug("Query: {}", query);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "CommunityMap/1.0");
            headers.set("Content-Type", "application/x-www-form-urlencoded");
            
            HttpEntity<String> entity = new HttpEntity<>(query, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    overpassApiUrl, HttpMethod.POST, entity, 
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
            
            return parseOverpassResponse(response.getBody(), defaultType);
            
        } catch (Exception e) {
            log.error("Error fetching data from Overpass API: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    @SuppressWarnings("unchecked")
    private List<Resource> parseOverpassResponse(Map<String, Object> response, String defaultType) {
        List<Resource> resources = new ArrayList<>();
        
        if (response != null && response.containsKey("elements")) {
            Object elementsObj = response.get("elements");
            if (elementsObj instanceof List) {
                List<Map<String, Object>> elements = (List<Map<String, Object>>) elementsObj;
                
                for (Map<String, Object> element : elements) {
                    try {
                        Resource resource = parseOverpassElement(element, defaultType);
                        if (resource != null) {
                            resources.add(resource);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse element: {}", e.getMessage());
                    }
                }
            }
        }
        
        log.info("Parsed {} resources of type {}", resources.size(), defaultType);
        return resources;
    }
    
    @SuppressWarnings("unchecked")
    private Resource parseOverpassElement(Map<String, Object> element, String defaultType) {
        Resource resource = new Resource();
        
        // Extract coordinates
        Object latObj = element.get("lat");
        Object lonObj = element.get("lon");
        
        if (latObj instanceof Number && lonObj instanceof Number) {
            double lat = ((Number) latObj).doubleValue();
            double lon = ((Number) lonObj).doubleValue();
            resource.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(lon, lat));
        } else {
            // Try center coordinates for ways/relations
            Object centerObj = element.get("center");
            if (centerObj instanceof Map) {
                Map<String, Object> center = (Map<String, Object>) centerObj;
                Object centerLat = center.get("lat");
                Object centerLon = center.get("lon");
                if (centerLat instanceof Number && centerLon instanceof Number) {
                    double lat = ((Number) centerLat).doubleValue();
                    double lon = ((Number) centerLon).doubleValue();
                    resource.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(lon, lat));
                } else {
                    return null; // Skip if no valid coordinates
                }
            } else {
                return null; // Skip if no valid coordinates
            }
        }
        
        // Extract tags
        Object tagsObj = element.get("tags");
        if (tagsObj instanceof Map) {
            Map<String, Object> tags = (Map<String, Object>) tagsObj;
            
            // Set name
            String name = extractName(tags);
            resource.setName(name);
            
            // Set type based on amenity
            String type = determineResourceType(tags, defaultType);
            resource.setType(type);
            
            // Set address
            String address = extractAddress(tags);
            resource.setAddress(address);
        } else {
            // Fallback if no tags
            resource.setName("Unknown " + defaultType);
            resource.setType(defaultType);
            resource.setAddress("Address not available");
        }
        
        return resource;
    }
    
    private String extractName(Map<String, Object> tags) {
        // Try different name fields in order of preference
        String[] nameFields = {"name", "brand", "operator", "ref", "official_name", "alt_name", "short_name"};
        for (String field : nameFields) {
            Object value = tags.get(field);
            if (value instanceof String && !((String) value).trim().isEmpty()) {
                return ((String) value).trim();
            }
        }
        
        // If no name found, try to create a descriptive name based on amenity
        Object amenity = tags.get("amenity");
        if (amenity instanceof String) {
            String amenityStr = (String) amenity;
            switch (amenityStr) {
                case "library":
                    return "Public Library";
                case "hospital":
                    return "Hospital";
                case "clinic":
                    return "Medical Clinic";
                case "doctors":
                    return "Doctor's Office";
                case "pharmacy":
                    return "Pharmacy";
                case "food_bank":
                    return "Food Bank";
                case "social_facility":
                    return "Social Services";
                default:
                    return "Community Resource";
            }
        }
        
        return "Community Resource";
    }
    
    private String determineResourceType(Map<String, Object> tags, String defaultType) {
        Object amenity = tags.get("amenity");
        if (amenity instanceof String) {
            String amenityStr = (String) amenity;
            switch (amenityStr) {
                case "library":
                    return "LIBRARY";
                case "hospital":
                case "clinic":
                case "doctors":
                case "pharmacy":
                    return "CLINIC";
                case "food_bank":
                case "social_facility":
                    return "FOOD_BANK";
                default:
                    return defaultType;
            }
        }
        return defaultType;
    }
    
    private String extractAddress(Map<String, Object> tags) {
        StringBuilder address = new StringBuilder();
        
        // Try to build address from available fields
        String[] addressFields = {"addr:housenumber", "addr:street", "addr:city", "addr:state", "addr:postcode"};
        for (String field : addressFields) {
            Object value = tags.get(field);
            if (value instanceof String && !((String) value).trim().isEmpty()) {
                if (address.length() > 0) {
                    address.append(" ");
                }
                address.append((String) value);
            }
        }
        
        if (address.length() == 0) {
            // Fallback to any address-like field
            Object addrValue = tags.get("addr:full");
            if (addrValue instanceof String && !((String) addrValue).trim().isEmpty()) {
                address.append((String) addrValue);
            } else {
                address.append("Address not available");
            }
        }
        
        return address.toString();
    }
}
