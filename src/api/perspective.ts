import axios from 'axios';

import { PerspectiveResponse, ToxicityAttributes } from './../typings/api.d';

export async function getToxicity(content: string, doNotStore: boolean): Promise<ToxicityAttributes> {
	const emojis =
		/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
	content = content.replace(emojis, '');

	if (!content) return { toxicity: NaN, insult: NaN, combined: NaN };

	const request = axios.create({
		baseURL: 'https://commentanalyzer.googleapis.com',
		headers: { 'Content-Type': 'application/json' },
		params: { key: process.env.PERSPECTIVE_KEY },
	});

	const payload = {
		comment: {
			text: content,
			type: 'PLAIN_TEXT',
		},
		requestedAttributes: { SEVERE_TOXICITY: {}, INSULT: {} },
		languages: ['en'],
		doNotStore,
	};

	const res = await request.post<PerspectiveResponse>('/v1alpha1/comments:analyze', payload);

	const toxicity = res.data.attributeScores['SEVERE_TOXICITY'].summaryScore.value;
	const insult = res.data.attributeScores['INSULT'].summaryScore.value;
	const combined = (toxicity + insult) / 2;
	const isSupportedLanguage = res.data.detectedLanguages.includes('en');

	return {
		toxicity,
		insult,
		combined,
		isSupportedLanguage,
	};
}
