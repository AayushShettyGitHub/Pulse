package com.example.worker.repository;

import com.example.worker.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByJobIdAndDateBetween(UUID jobId, LocalDate start, LocalDate end);
    List<AttendanceRecord> findByJobIdAndDate(UUID jobId, LocalDate date);
}
