package com.pharmacy.management.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    public Map<String, String> getCurrentUser(Authentication authentication) {
        Map<String, String> userDetails = new HashMap<>();

        // 1. Check if authentication exists to avoid NullPointer
        if (authentication == null || !authentication.isAuthenticated()) {
            userDetails.put("username", "anonymous");
            userDetails.put("role", "NONE");
            return userDetails;
        }

        // 2. Fix the Role extraction logic
        String role = authentication.getAuthorities().stream()
                .map(auth -> ((GrantedAuthority) auth).getAuthority()) // Explicit casting for clarity
                .findFirst()
                .orElse("ROLE_USER");

        // 3. Use .put() instead of .setName()
        userDetails.put("username", authentication.getName());
        userDetails.put("role", role.replace("ROLE_", "")); // Returns ADMIN, SELLER, etc.

        return userDetails;
    }
}