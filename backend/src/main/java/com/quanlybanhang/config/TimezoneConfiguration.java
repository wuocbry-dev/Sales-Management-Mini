package com.quanlybanhang.config;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimezoneConfiguration {

  @PostConstruct
  public void setDefaultTimezone() {
    TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
  }
}