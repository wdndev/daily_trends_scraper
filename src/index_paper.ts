import { PaperAnalysisScraper } from './providers/PaperAnalysisScraper';

if (require.main === module) {
  (async () => {
    const paper_analysis_scraper = new PaperAnalysisScraper();
    const result = await paper_analysis_scraper.fetchInterpretation('2507.13266v1');
    console.log(result);
  })();
}