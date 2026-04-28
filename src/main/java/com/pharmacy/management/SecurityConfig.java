package com.pharmacy.management;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable for development
                .authorizeHttpRequests(auth -> auth
                        // Add "/api/user/me" to the permitAll list
                        .requestMatchers("/login.html", "/login-style.css", "/login-script.js", "/api/user/me").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login.html")      // The path to your file
                        .loginProcessingUrl("/login")  // The 'action' in your HTML form
                        .defaultSuccessUrl("/", true)  // Where to go after success
                        .permitAll()
                )
                .logout(logout -> logout.permitAll());

        return http.build();
    }
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails admin = User.withDefaultPasswordEncoder()
                .username("admin")
                .password("admin123")
                .roles("ADMIN")
                .build();

        UserDetails seller = User.withDefaultPasswordEncoder()
                .username("seller")
                .password("sell123")
                .roles("SELLER") // Check this spelling!
                .build();

        UserDetails keeper = User.withDefaultPasswordEncoder()
                .username("keeper")
                .password("keep123")
                .roles("STORE_KEEPER")
                .build();

        return new InMemoryUserDetailsManager(admin, seller, keeper);
    }
}