package com.arrowdatatech.adt_production_report.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {

    /**
     * Forwards specific React client-side page paths to /index.html.
     * This uses the standard Spring PathPatternParser syntax {*path} for wildcards.
     */
    @RequestMapping(value = {
        "/about",
        "/services",
        "/services/{*path}",
        "/contact",
        "/careers",
        "/sitemap",
        "/workwise",
        "/workwise/{*path}"
    })
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}
