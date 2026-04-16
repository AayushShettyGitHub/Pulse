package com.example.backend.repository;

import com.example.backend.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByJobIdAndDate(UUID jobId, LocalDate date);
    List<AttendanceRecord> findByJobId(UUID jobId);
}
