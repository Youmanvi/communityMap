package com.example.communitymap.service;

import com.example.communitymap.exception.InvalidLocationException;
import com.example.communitymap.exception.ResourceNotFoundException;
import com.example.communitymap.exception.ValidationException;
import com.example.communitymap.model.Resource;
import com.example.communitymap.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceService {
    
    private final ResourceRepository resourceRepository;
    
    public Resource addResource(Resource resource) {
        validateResource(resource);
        log.info("Adding new resource: {}", resource.getName());
        return resourceRepository.save(resource);
    }
    
    public Page<Resource> getAllResources(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        log.debug("Fetching resources - page: {}, size: {}", page, size);
        return resourceRepository.findAll(pageable);
    }
    
    public List<Resource> getAllResources() {
        log.debug("Fetching all resources");
        return resourceRepository.findAll();
    }
    
    public Resource getResourceById(String id) {
        log.debug("Fetching resource with id: {}", id);
        return resourceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
    }
    
    public List<Resource> findResourcesNearby(double longitude, double latitude, double distanceInMiles) {
        validateCoordinates(longitude, latitude);
        validateDistance(distanceInMiles);
        
        // Convert miles to meters (1 mile = 1609.34 meters)
        double distanceInMeters = distanceInMiles * 1609.34;
        
        Point point = new Point(longitude, latitude);
        Distance distance = new Distance(distanceInMeters);
        
        log.info("Searching for resources near ({}, {}) within {} miles", latitude, longitude, distanceInMiles);
        List<Resource> results = resourceRepository.findByLocationNear(point, distance);
        log.info("Found {} resources nearby", results.size());
        
        return results;
    }
    
    public Resource updateResource(String id, Resource resource) {
        validateResource(resource);
        Resource existingResource = getResourceById(id);
        
        existingResource.setName(resource.getName());
        existingResource.setType(resource.getType());
        existingResource.setAddress(resource.getAddress());
        existingResource.setLocation(resource.getLocation());
        
        log.info("Updating resource with id: {}", id);
        return resourceRepository.save(existingResource);
    }
    
    public void deleteResource(String id) {
        Resource resource = getResourceById(id);
        log.info("Deleting resource with id: {}", id);
        resourceRepository.delete(resource);
    }
    
    private void validateResource(Resource resource) {
        if (resource == null) {
            throw new ValidationException("Resource cannot be null");
        }
        if (resource.getName() == null || resource.getName().trim().isEmpty()) {
            throw new ValidationException("Resource name cannot be empty");
        }
        if (resource.getType() == null || resource.getType().trim().isEmpty()) {
            throw new ValidationException("Resource type cannot be empty");
        }
        if (resource.getAddress() == null || resource.getAddress().trim().isEmpty()) {
            throw new ValidationException("Resource address cannot be empty");
        }
        if (resource.getLocation() == null) {
            throw new ValidationException("Resource location cannot be null");
        }
    }
    
    private void validateCoordinates(double longitude, double latitude) {
        if (longitude < -180 || longitude > 180) {
            throw new InvalidLocationException("Longitude must be between -180 and 180");
        }
        if (latitude < -90 || latitude > 90) {
            throw new InvalidLocationException("Latitude must be between -90 and 90");
        }
    }
    
    private void validateDistance(double distance) {
        if (distance <= 0) {
            throw new ValidationException("Distance must be greater than 0");
        }
        if (distance > 100) {
            throw new ValidationException("Distance cannot exceed 100 miles");
        }
    }
}
