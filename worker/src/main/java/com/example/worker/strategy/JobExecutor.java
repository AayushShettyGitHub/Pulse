package com.example.worker.strategy;

import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;

public interface JobExecutor {
    boolean execute(Job job, JobExecution execution);
}
