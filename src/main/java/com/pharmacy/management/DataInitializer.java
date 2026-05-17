package com.pharmacy.management;

import com.pharmacy.management.model.User;
import com.pharmacy.management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only insert records if our live database tables are currently empty
        if (userRepository.count() == 0) {

            // 1. Create Enterprise Admin
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123")); // Scrambled using BCrypt!
            admin.setRole("ROLE_ADMIN");
            userRepository.save(admin);

            // 2. Create Front-Desk Seller
            User seller = new User();
            seller.setUsername("seller");
            seller.setPassword(passwordEncoder.encode("sell123"));
            seller.setRole("ROLE_SELLER");
            userRepository.save(seller);

            // 3. Create Warehouse Keeper
            User keeper = new User();
            keeper.setUsername("keeper");
            keeper.setPassword(passwordEncoder.encode("keep123"));
            keeper.setRole("ROLE_STORE_KEEPER");
            userRepository.save(keeper);

            System.out.println("✅ Security Database Seeded: admin, seller, and keeper accounts are now live!");
        }
    }
}