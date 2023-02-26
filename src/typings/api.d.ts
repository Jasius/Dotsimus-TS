export interface PerspectiveResponse {
	attributeScores: {
		[key: string]: {
			spanScores: [
				{
					begin: number;
					end: number;
					score: {
						value: number;
						type: string;
					};
				},
			];
			summaryScore: {
				value: number;
				type: string;
			};
		};
	};
	languages: string[];
	detectedLanguages: string[];
}

export interface ToxicityAttributes {
	toxicity: number;
	insult: number;
	combined: number;
	isSupportedLanguage?: boolean;
}
