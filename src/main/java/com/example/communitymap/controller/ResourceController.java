package com.example.communitymap.controller;

import com.example.communitymap.model.Resource;
import com.example.communitymap.service.ResourceService;
import com.example.communitymap.service.OverpassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
@Slf4j
public class ResourceController {
    
    private final ResourceService resourceService;
    private final OverpassService overpassService;
    
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        log.info("GET /api/resources - Fetching all resources");
        List<Resource> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<Resource>> getAllResourcesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/resources/paginated - page: {}, size: {}", page, size);
        Page<Resource> resources = resourceService.getAllResources(page, size);
        return ResponseEntity.ok(resources);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        log.info("GET /api/resources/{} - Fetching resource by id", id);
        Resource resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }
    
    @PostMapping
    public ResponseEntity<Resource> addResource(@Valid @RequestBody Resource resource) {
        log.info("POST /api/resources - Adding new resource: {}", resource.getName());
        Resource savedResource = resourceService.addResource(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @Valid @RequestBody Resource resource) {
        log.info("PUT /api/resources/{} - Updating resource", id);
        Resource updatedResource = resourceService.updateResource(id, resource);
        return ResponseEntity.ok(updatedResource);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        log.info("DELETE /api/resources/{} - Deleting resource", id);
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/search/nearby")
    public ResponseEntity<List<Resource>> getNearbyResources(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1.0") double dist) {
        log.info("GET /api/resources/search/nearby - lat: {}, lon: {}, dist: {}", lat, lon, dist);
        List<Resource> resources = resourceService.findResourcesNearby(lon, lat, dist);
        return ResponseEntity.ok(resources);
    }
    
    @GetMapping("/fetch/overpass")
    public ResponseEntity<List<Resource>> fetchOverpassResources(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "5.0") double radiusKm,
            @RequestParam(required = false) String type) {
        log.info("GET /api/resources/fetch/overpass - lat: {}, lon: {}, radius: {}km, type: {}", lat, lon, radiusKm, type);
        
        // Use the optimized combined method for better performance
        List<Resource> resources = overpassService.fetchAllResources(lat, lon, radiusKm);
        
        // Filter by type if specified
        if (type != null && !type.equalsIgnoreCase("all")) {
            String filterType = type.toUpperCase();
            switch (filterType) {
                case "LIBRARY":
                    resources = resources.stream()
                        .filter(r -> "LIBRARY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "HEALTHCARE":
                case "CLINIC":
                    resources = resources.stream()
                        .filter(r -> "CLINIC".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "HOSPITAL":
                    resources = resources.stream()
                        .filter(r -> "HOSPITAL".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "PHARMACY":
                    resources = resources.stream()
                        .filter(r -> "PHARMACY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "FOOD":
                case "FOOD_BANK":
                    resources = resources.stream()
                        .filter(r -> "FOOD_BANK".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "SOCIAL":
                case "SOCIAL_FACILITY":
                    resources = resources.stream()
                        .filter(r -> "SOCIAL_FACILITY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
            }
        }
        
        return ResponseEntity.ok(resources);
    }
    
    @PostMapping("/fetch-and-save")
    public ResponseEntity<List<Resource>> fetchAndSaveOverpassResources(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "5.0") double radiusKm,
            @RequestParam(required = false) String type) {
        log.info("POST /api/resources/fetch-and-save - lat: {}, lon: {}, radius: {}km, type: {}", lat, lon, radiusKm, type);
        
        // Use the optimized combined method for better performance
        List<Resource> fetchedResources = overpassService.fetchAllResources(lat, lon, radiusKm);
        
        // Filter by type if specified
        if (type != null && !type.equalsIgnoreCase("all")) {
            String filterType = type.toUpperCase();
            switch (filterType) {
                case "LIBRARY":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "LIBRARY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "HEALTHCARE":
                case "CLINIC":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "CLINIC".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "HOSPITAL":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "HOSPITAL".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "PHARMACY":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "PHARMACY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "FOOD":
                case "FOOD_BANK":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "FOOD_BANK".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
                case "SOCIAL":
                case "SOCIAL_FACILITY":
                    fetchedResources = fetchedResources.stream()
                        .filter(r -> "SOCIAL_FACILITY".equals(r.getType()))
                        .collect(java.util.stream.Collectors.toList());
                    break;
            }
        }
        
        // Save fetched resources to database
        List<Resource> savedResources = new java.util.ArrayList<>();
        for (Resource resource : fetchedResources) {
            try {
                Resource savedResource = resourceService.addResource(resource);
                savedResources.add(savedResource);
            } catch (Exception e) {
                log.warn("Failed to save resource {}: {}", resource.getName(), e.getMessage());
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResources);
    }
}
