import { FilterService } from '@/services/filter.service';
import { HnItemPayload } from '@/types/index.types';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    service = new FilterService();
  });

  it('should categorize a job type item as job', () => {
    const jobItem: HnItemPayload = {
      id: 1,
      type: 'job',
      by: 'someone',
      time: 1000,
      title: 'Stripe is Hiring Software Engineers',
      url: 'https://stripe.com/jobs',
    };

    expect(service.categorizeItem(jobItem)).toBe('job');
  });

  it('should categorize a story starting with Ask HN: Who is hiring as job', () => {
    const jobStory: HnItemPayload = {
      id: 2,
      type: 'story',
      by: 'whoishiring',
      time: 1000,
      title: 'Ask HN: Who is hiring? (May 2026)',
      text: 'Post your job descriptions here...',
    };

    expect(service.categorizeItem(jobStory)).toBe('job');
  });

  it('should categorize technical stories as technical', () => {
    const techStory1: HnItemPayload = {
      id: 3,
      type: 'story',
      by: 'coder',
      time: 1000,
      title: 'Building a compiler in Rust and WebAssembly',
    };

    const techStory2: HnItemPayload = {
      id: 4,
      type: 'story',
      by: 'db_admin',
      time: 1000,
      title: 'Deep dive into Postgres query planning and indexing',
    };

    expect(service.categorizeItem(techStory1)).toBe('technical');
    expect(service.categorizeItem(techStory2)).toBe('technical');
  });

  it('should categorize startup and funding stories as startup', () => {
    const startupStory1: HnItemPayload = {
      id: 5,
      type: 'story',
      by: 'founder',
      time: 1000,
      title: 'Our YC startup just raised a $2M seed round',
    };

    const startupStory2: HnItemPayload = {
      id: 6,
      type: 'story',
      by: 'investor',
      time: 1000,
      title: 'How bootstrapping a SaaS to $10M ARR works in 2026',
    };

    expect(service.categorizeItem(startupStory1)).toBe('startup');
    expect(service.categorizeItem(startupStory2)).toBe('startup');
  });

  it('should resolve conflicts using keyword count scoring and fall back to technical on tie', () => {
    // 2 tech keywords (Rust, compiler), 1 startup keyword (startup) => technical
    const story1: HnItemPayload = {
      id: 7,
      type: 'story',
      by: 'dev',
      time: 1000,
      title: 'Our startup built a fast SQL compiler in Rust',
    };

    // 1 tech keyword (Rust), 2 startup keywords (SaaS, startup) => startup
    const story2: HnItemPayload = {
      id: 8,
      type: 'story',
      by: 'dev',
      time: 1000,
      title: 'Launching our new Rust-based SaaS startup',
    };

    // 1 tech (Rust), 1 startup (startup) => tie, falls back to technical
    const story3: HnItemPayload = {
      id: 9,
      type: 'story',
      by: 'dev',
      time: 1000,
      title: 'Rust startup deep-dive',
    };

    expect(service.categorizeItem(story1)).toBe('technical');
    expect(service.categorizeItem(story2)).toBe('startup');
    expect(service.categorizeItem(story3)).toBe('technical');
  });

  it('should skip other item types (comments, polls, non-matching stories)', () => {
    const commentItem: HnItemPayload = {
      id: 10,
      type: 'comment',
      by: 'user',
      time: 1000,
      text: 'I think Rust is great.',
    };

    const unmatchingStory: HnItemPayload = {
      id: 11,
      type: 'story',
      by: 'blogger',
      time: 1000,
      title: 'A beautiful walk in the park near Zurich',
    };

    expect(service.categorizeItem(commentItem)).toBe('skip');
    expect(service.categorizeItem(unmatchingStory)).toBe('skip');
  });
});
