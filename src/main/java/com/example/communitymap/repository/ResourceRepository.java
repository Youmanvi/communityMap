package com.example.communitymap.repository;

import com.example.communitymap.model.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    
    // Find resources within a certain distance of a point
    List<Resource> findByLocationNear(Point point, Distance distance);
    
    // Optimized query with pagination for better performance
    @Query("{ 'location': { $near: { $geometry: { type: 'Point', coordinates: [?1, ?0] }, $maxDistance: ?2 } } }")
    List<Resource> findNearbyResourcesOptimized(double latitude, double longitude, double maxDistance, Pageable pageable);
    
    // Find resources by type with location filter
    @Query("{ 'type': ?0, 'location': { $near: { $geometry: { type: 'Point', coordinates: [?2, ?1] }, $maxDistance: ?3 } } }")
    List<Resource> findByTypeAndLocationNear(String type, double latitude, double longitude, double maxDistance);
    
    // Count resources in area for performance monitoring
    @Query(value = "{ 'location': { $near: { $geometry: { type: 'Point', coordinates: [?1, ?0] }, $maxDistance: ?2 } } }", count = true)
    long countNearbyResources(double latitude, double longitude, double maxDistance);
}
