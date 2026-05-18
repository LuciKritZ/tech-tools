import { HnItemPayload } from '@/types/index.types';

export interface IParsedJob {
  hnId: number;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  salary?: string;
  techStack: string[];
  status: 'active' | 'inactive';
  rawText: string;
}

export class JobManagerService {
  private techKeywords = [
    { name: 'React', regex: /\breact(?:\.js)?\b/i },
    { name: 'Node.js', regex: /\bnode(?:\.js)?\b/i },
    { name: 'TypeScript', regex: /\btypescript\b/i },
    { name: 'JavaScript', regex: /\bjavascript\b/i },
    { name: 'Rust', regex: /\brust\b/i },
    { name: 'Go', regex: /\bgo(?:lang)?\b/i },
    { name: 'Python', regex: /\bpython\b/i },
    { name: 'Ruby', regex: /\bruby\b/i },
    { name: 'Rails', regex: /\brails\b/i },
    { name: 'Kubernetes', regex: /\bkubernetes\b|k8s/i },
    { name: 'Docker', regex: /\bdocker\b/i },
    { name: 'AWS', regex: /\baws\b|amazon\s+web\s+services/i },
    { name: 'Postgres', regex: /\bpostgres(?:ql)?\b/i },
    { name: 'MongoDB', regex: /\bmongodb\b/i },
  ];

  /**
   * Helper to clean piped strings.
   */
  private clean(str: string): string {
    return str.replace(/^[\s\-|]+|[\s\-|]+$/g, '').trim();
  }

  /**
   * Parses a raw HN item payload into a typed parsed job structure.
   */
  parseJob(item: HnItemPayload): IParsedJob {
    const title = item.title || '';
    const text = item.text || '';
    const combinedText = `${title} ${text}`;

    let company = '';
    let role = '';
    let location = '';
    let salary: string | undefined;

    // 1. Analyze if the title uses piped structure (e.g. Stripe | Software Engineer | Remote)
    const pipedSegments = title
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    if (pipedSegments.length >= 3) {
      company = pipedSegments[0];
      role = pipedSegments[1];
      location = pipedSegments[2];

      // If segment 3 exists, try to see if it is a salary
      if (pipedSegments[3]) {
        if (/\$[0-9]+/.test(pipedSegments[3])) {
          salary = pipedSegments[3];
        }
      }
    } else {
      // 2. Fallback heuristic pattern matching (e.g. Google is hiring a Senior Kubernetes Architect in Mountain View)
      const hiringRegex = /^([A-Za-z0-9\s.\-_]+?)\s+(?:is\s+hiring|hiring|is\s+looking\s+for)\s+(?:a\s+|an\s+)?(.+)$/i;
      const match = title.match(hiringRegex);

      if (match) {
        company = this.clean(match[1]);
        const roleAndLoc = match[2];

        // Try to separate location from role by matching "in " or "at " or "remote"
        const locIndex = roleAndLoc.search(/\bin\s+/i);
        if (locIndex !== -1) {
          role = this.clean(roleAndLoc.substring(0, locIndex));
          location = this.clean(roleAndLoc.substring(locIndex + 3));
        } else {
          role = this.clean(roleAndLoc);
          location = 'Unknown';
        }
      } else {
        // Absolute fallback defaults
        company = title.split(' ')[0] || item.by || 'Unknown';
        role = title || 'Software Engineer';
        location = 'Unknown';
      }
    }

    // 3. Remote flag detection
    const remote = /\bremote\b/i.test(combinedText) || /\btelecommute\b/i.test(combinedText);
    if (remote && location.toLowerCase() !== 'remote' && !location.toLowerCase().includes('remote')) {
      if (location === 'Unknown') {
        location = 'Remote';
      }
    }

    // 4. Salary extraction if not already resolved from pipes
    if (!salary) {
      const salaryMatch = combinedText.match(/\$[0-9]+[kK]?\s*(?:-\s*\$[0-9]+[kK]?)?/);
      if (salaryMatch) {
        salary = salaryMatch[0];
      }
    }

    // 5. Tech Stack extraction
    const techStack: string[] = [];
    for (const tech of this.techKeywords) {
      if (tech.regex.test(combinedText)) {
        // Map back to standard names like React, Node, etc.
        const mappedName =
          tech.name === 'Node.js' && combinedText.includes('Node') && !combinedText.includes('Node.js') ? 'Node' : tech.name;
        techStack.push(mappedName);
      }
    }

    // 6. Active/Inactive Status Check
    const isClosed = /position\s+filled|closed|no\s+longer\s+hiring/i.test(combinedText);
    const status: 'active' | 'inactive' = isClosed ? 'inactive' : 'active';

    return {
      hnId: item.id,
      company,
      role,
      location,
      remote,
      salary,
      techStack,
      status,
      rawText: text || title,
    };
  }
}
