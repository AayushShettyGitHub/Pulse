package com.example.scheduler.repository;

import com.example.scheduler.enums.JobStatus;
import com.example.scheduler.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByStatus(JobStatus status);
    List<Job> findByStatusAndNextRunBefore(JobStatus status, java.time.LocalDateTime now);
    List<Job> findByStatusInAndNextRunBefore(List<JobStatus> statuses, java.time.LocalDateTime now);
}
