package com.example.communitymap.config;

import com.example.communitymap.model.Resource;
import com.example.communitymap.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    
    private final ResourceRepository resourceRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Only populate if database is empty
        if (resourceRepository.count() == 0) {
            // Dallas area coordinates for sample data
            Resource library1 = new Resource();
            library1.setName("Central City Library");
            library1.setType("LIBRARY");
            library1.setAddress("1515 Young St, Dallas, TX 75201");
            library1.setLocation(new GeoJsonPoint(-96.7970, 32.7767));
            
            Resource library2 = new Resource();
            library2.setName("Oak Lawn Branch Library");
            library2.setType("LIBRARY");
            library2.setAddress("4100 Cedar Springs Rd, Dallas, TX 75219");
            library2.setLocation(new GeoJsonPoint(-96.8000, 32.8000));
            
            Resource clinic1 = new Resource();
            clinic1.setName("Parkland Health Center");
            clinic1.setType("CLINIC");
            clinic1.setAddress("5200 Harry Hines Blvd, Dallas, TX 75235");
            clinic1.setLocation(new GeoJsonPoint(-96.8500, 32.8200));
            
            Resource clinic2 = new Resource();
            clinic2.setName("Baylor Scott & White Medical Center");
            clinic2.setType("CLINIC");
            clinic2.setAddress("3500 Gaston Ave, Dallas, TX 75246");
            clinic2.setLocation(new GeoJsonPoint(-96.7800, 32.7900));
            
            Resource foodBank1 = new Resource();
            foodBank1.setName("North Texas Food Bank");
            foodBank1.setType("FOOD_BANK");
            foodBank1.setAddress("4500 S Cockrell Hill Rd, Dallas, TX 75236");
            foodBank1.setLocation(new GeoJsonPoint(-96.8500, 32.7500));
            
            Resource foodBank2 = new Resource();
            foodBank2.setName("Crossroads Community Services");
            foodBank2.setType("FOOD_BANK");
            foodBank2.setAddress("4500 S Lancaster Rd, Dallas, TX 75216");
            foodBank2.setLocation(new GeoJsonPoint(-96.7500, 32.7500));
            
            Resource library3 = new Resource();
            library3.setName("Highland Park Library");
            library3.setType("LIBRARY");
            library3.setAddress("4700 Drexel Dr, Highland Park, TX 75205");
            library3.setLocation(new GeoJsonPoint(-96.8000, 32.8200));
            
            Resource clinic3 = new Resource();
            clinic3.setName("Children's Medical Center Dallas");
            clinic3.setType("CLINIC");
            clinic3.setAddress("1935 Medical District Dr, Dallas, TX 75235");
            clinic3.setLocation(new GeoJsonPoint(-96.8400, 32.8100));
            
            // Save all resources
            resourceRepository.save(library1);
            resourceRepository.save(library2);
            resourceRepository.save(clinic1);
            resourceRepository.save(clinic2);
            resourceRepository.save(foodBank1);
            resourceRepository.save(foodBank2);
            resourceRepository.save(library3);
            resourceRepository.save(clinic3);
            
            System.out.println("Sample data loaded successfully!");
        }
    }
}
