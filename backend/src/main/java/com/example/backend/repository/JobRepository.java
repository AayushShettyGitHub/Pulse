package com.example.backend.repository;

import com.example.backend.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.backend.enums.JobStatus;
import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByStatus(JobStatus status);
    List<Job> findByCreatedBy(String createdBy);
}
