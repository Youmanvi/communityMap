package com.example.communitymap.controller;

import com.example.communitymap.model.Resource;
import com.example.communitymap.service.ResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
@Slf4j
public class DemoController {
    
    private final ResourceService resourceService;
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDemoStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("application", "CommunityMap Demo");
        status.put("version", "1.0.0");
        status.put("status", "running");
        status.put("totalResources", resourceService.getAllResources().size());
        status.put("features", List.of(
            "Resource Management",
            "Geospatial Search",
            "External API Integration",
            "RESTful API",
            "MongoDB Storage"
        ));
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/sample-data")
    public ResponseEntity<Map<String, Object>> getSampleDataInfo() {
        Map<String, Object> info = new HashMap<>();
        List<Resource> allResources = resourceService.getAllResources();
        
        info.put("totalResources", allResources.size());
        info.put("resourceTypes", allResources.stream()
            .map(Resource::getType)
            .distinct()
            .toList());
        
        Map<String, Long> typeCounts = allResources.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                Resource::getType, 
                java.util.stream.Collectors.counting()
            ));
        info.put("typeCounts", typeCounts);
        
        return ResponseEntity.ok(info);
    }
    
    @GetMapping("/nearby-demo")
    public ResponseEntity<Map<String, Object>> getNearbyDemo(
            @RequestParam(defaultValue = "32.7767") double lat,
            @RequestParam(defaultValue = "-96.7970") double lon,
            @RequestParam(defaultValue = "5.0") double distance) {
        
        log.info("Demo nearby search - lat: {}, lon: {}, distance: {}", lat, lon, distance);
        
        Map<String, Object> result = new HashMap<>();
        result.put("searchLocation", Map.of("latitude", lat, "longitude", lon));
        result.put("searchDistance", distance + " miles");
        
        List<Resource> nearbyResources = resourceService.findResourcesNearby(lon, lat, distance);
        result.put("foundResources", nearbyResources.size());
        result.put("resources", nearbyResources);
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/add-sample")
    public ResponseEntity<Map<String, Object>> addSampleResource(
            @RequestParam String name,
            @RequestParam String type,
            @RequestParam String address,
            @RequestParam double lat,
            @RequestParam double lon) {
        
        log.info("Adding sample resource: {} ({})", name, type);
        
        Resource resource = new Resource();
        resource.setName(name);
        resource.setType(type.toUpperCase());
        resource.setAddress(address);
        resource.setLocation(new GeoJsonPoint(lon, lat));
        
        try {
            Resource savedResource = resourceService.addResource(resource);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Resource added successfully");
            result.put("resource", savedResource);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Failed to add resource: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/search-demo")
    public ResponseEntity<Map<String, Object>> searchDemo(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String name) {
        
        List<Resource> allResources = resourceService.getAllResources();
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalResources", allResources.size());
        
        List<Resource> filteredResources = allResources.stream()
            .filter(resource -> {
                boolean typeMatch = type == null || type.isEmpty() || 
                    resource.getType().equalsIgnoreCase(type);
                boolean nameMatch = name == null || name.isEmpty() || 
                    resource.getName().toLowerCase().contains(name.toLowerCase());
                return typeMatch && nameMatch;
            })
            .toList();
        
        result.put("filteredResources", filteredResources.size());
        result.put("resources", filteredResources);
        
        if (type != null) {
            result.put("searchType", type);
        }
        if (name != null) {
            result.put("searchName", name);
        }
        
        return ResponseEntity.ok(result);
    }
}
