package com.example.communitymap.repository;

import com.example.communitymap.model.Resource;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    // Find resources within a certain distance of a point
    List<Resource> findByLocationNear(Point point, Distance distance);
}
