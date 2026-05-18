import { JobManagerService } from '@/services/job-manager.service';
import { HnItemPayload } from '@/types/index.types';

describe('JobManagerService', () => {
  let service: JobManagerService;

  beforeEach(() => {
    service = new JobManagerService();
  });

  describe('parseJob', () => {
    it('should successfully parse standard piped format', () => {
      const mockItem: HnItemPayload = {
        id: 999,
        type: 'job',
        by: 'stripe_recruiter',
        time: 1000,
        title: 'Stripe | Software Engineer | Remote (US/Canada) | $150k - $200k | React, Node, TypeScript',
        text: 'Come join Stripe to build payments infrastructure. We use React, Node, and TypeScript.',
      };

      const job = service.parseJob(mockItem);

      expect(job.hnId).toBe(999);
      expect(job.company).toBe('Stripe');
      expect(job.role).toBe('Software Engineer');
      expect(job.location).toBe('Remote (US/Canada)');
      expect(job.remote).toBe(true);
      expect(job.salary).toBe('$150k - $200k');
      expect(job.techStack).toContain('React');
      expect(job.techStack).toContain('Node');
      expect(job.techStack).toContain('TypeScript');
      expect(job.status).toBe('active');
    });

    it('should fallback to reasonable defaults when pipes are missing', () => {
      const mockItem: HnItemPayload = {
        id: 888,
        type: 'job',
        by: 'google_recruiter',
        time: 1000,
        title: 'Google is hiring a Senior Kubernetes Architect in Mountain View',
      };

      const job = service.parseJob(mockItem);

      expect(job.hnId).toBe(888);
      expect(job.company).toBe('Google');
      expect(job.role).toBe('Senior Kubernetes Architect');
      expect(job.location).toBe('Mountain View');
      expect(job.remote).toBe(false);
      expect(job.techStack).toContain('Kubernetes');
      expect(job.status).toBe('active');
    });

    it('should detect deactivation from description text', () => {
      const mockItem: HnItemPayload = {
        id: 777,
        type: 'job',
        by: 'recruiter',
        time: 1000,
        title: 'Acme | Node Developer | Remote',
        text: '[POSITION FILLED] We have closed this role.',
      };

      const job = service.parseJob(mockItem);
      expect(job.status).toBe('inactive');
    });
  });
});
