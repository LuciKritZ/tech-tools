import { HnItemPayload } from '@/types/index.types';

export class FilterService {
  private technicalKeywords = [
    /\brust\b/i,
    /\btypescript\b/i,
    /\bjavascript\b/i,
    /\bcompiler\b/i,
    /\bkernel\b/i,
    /\bdatabase\b/i,
    /\bkubernetes\b/i,
    /\bcryptography\b/i,
    /\blinux\b/i,
    /\bbackend\b/i,
    /\bfrontend\b/i,
    /\bmachine\s+learning\b/i,
    /\bdeep\s+learning\b/i,
    /\bneural\s+network\b/i,
    /\bpostgres\b/i,
    /\bredis\b/i,
    /\bdocker\b/i,
    /\bwebassembly\b/i,
    /\bwasi\b/i,
    /\bzig\b/i,
    /\bgolang\b/i,
    /\bsql\b/i,
    /\bindexing\b/i,
  ];

  private startupKeywords = [
    /\bstartup\b/i,
    /\bsaas\b/i,
    /\bseed\s+round\b/i,
    /\bseries\s+[a-z]\b/i,
    /\bfunding\b/i,
    /\byc\b/i,
    /\by\s+combinator\b/i,
    /\bfounder\b/i,
    /\bventure\s+capital\b/i,
    /\bbootstrapped\b/i,
    /\bacquisition\b/i,
    /\bproduct\s+launch\b/i,
    /\bpre-seed\b/i,
    /\barr\b/i,
    /\braises\s+\$[0-9]+[km]?\b/i,
  ];

  /**
   * Evaluates if a case-insensitive match count for a given text matches the regex set.
   */
  private getMatchCount(text: string, regexList: RegExp[]): number {
    let count = 0;
    for (const regex of regexList) {
      if (regex.test(text)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Categorizes a Hacker News item payload into one of the four categories:
   * 'technical' | 'startup' | 'job' | 'skip'
   */
  categorizeItem(item: HnItemPayload): 'technical' | 'startup' | 'job' | 'skip' {
    // 1. Job type checks
    if (item.type === 'job') {
      return 'job';
    }

    if (item.title && /ask\s+hn:\s+who\s+is\s+hiring/i.test(item.title)) {
      return 'job';
    }

    // 2. Only stories are parsed for tech / startup news
    if (item.type !== 'story') {
      return 'skip';
    }

    const title = item.title || '';
    const text = item.text || '';
    const combinedContent = `${title} ${text}`;

    // 3. Heuristics matching and scoring
    const technicalScore = this.getMatchCount(combinedContent, this.technicalKeywords);
    const startupScore = this.getMatchCount(combinedContent, this.startupKeywords);

    if (technicalScore === 0 && startupScore === 0) {
      return 'skip';
    }

    // Tiebreaker: favor technical on tie
    if (technicalScore >= startupScore) {
      return 'technical';
    } else {
      return 'startup';
    }
  }
}
