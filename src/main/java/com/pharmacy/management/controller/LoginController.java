package com.pharmacy.management.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String login() {
        // This tells Spring: "When someone goes to /login, show them login.html"
        return "forward:/login.html";
    }
}