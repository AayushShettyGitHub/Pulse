package com.example.backend.controller;

import com.example.backend.model.AttendanceRecord;
import com.example.backend.repository.AttendanceRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/attendance", "/api/attendance"})
public class AttendanceController {

    private final AttendanceRepository repository;

    public AttendanceController(AttendanceRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/{jobId}")
    public List<AttendanceRecord> markAttendance(@PathVariable UUID jobId, @RequestBody List<AttendanceRecord> records) {
        for (AttendanceRecord r : records) {
            r.setJobId(jobId);
            r.setDate(LocalDate.now());
        }
        return repository.saveAll(records);
    }

    @GetMapping("/{jobId}")
    public List<AttendanceRecord> getAttendanceHistory(@PathVariable UUID jobId) {
        return repository.findByJobId(jobId);
    }
}
