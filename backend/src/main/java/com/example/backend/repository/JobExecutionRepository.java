package com.example.backend.repository;

import com.example.backend.model.JobExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobExecutionRepository extends JpaRepository<JobExecution, UUID> {
    List<JobExecution> findByJobIdOrderByExecutedAtDesc(UUID jobId);
    
    @Transactional
    void deleteByJobId(UUID jobId);
}
