package com.example.scheduler.service;

import com.example.scheduler.enums.JobStatus;
import com.example.scheduler.model.Job;
import com.example.scheduler.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class JobScheduler {

    private final JobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelay = 5000)
    public void scheduleJobs() {
        List<Job> jobs = jobRepository.findByStatusInAndNextRunBefore(
            Arrays.asList(JobStatus.PENDING, JobStatus.RETRYING), 
            java.time.LocalDateTime.now()
        );

        for (Job job : jobs) {
            job.setStatus(JobStatus.QUEUED);
            jobRepository.save(job);
            
            try {
                rabbitTemplate.convertAndSend("jobQueue", job.getId().toString());
            } catch (Exception e) {
                job.setStatus(JobStatus.PENDING);
                jobRepository.save(job);
            }
        }
    }
}
