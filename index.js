import { Router } from 'itty-router';

// Create a new router
const router = Router();

/*
Our index route, a simple hello world.
*/
router.get('/', () => {
	return new Response('Home page');
});


router.get('/records', async (request, env) => {
	const day = request.query.day;

	// 查詢日期
	const ymonth = (day ? new Date(day) : new Date()).toISOString().slice(0, 7);

	// 使用 cloudflare kv
	const key = `${ymonth}-record`;

	// 取得 kv 資料
	const value = await env.RECORD.get(key);

	let records = value ? JSON.parse(value) : []

	records.sort((a, b) => b.createdAt - a.createdAt);

	records = records
			.map((record) => ({
				...record,
				createdAt: new Date(record.createdAt).toISOString(),
			}));

	return new Response(JSON.stringify(records, null, 2), {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	});
});

router.post('/records', async (request, env) => {
	// body: { name, status }
	const {
		name,
		status
	} = (await request.json());

	// 月日期
	const ymonth = new Date().toISOString().slice(0, 7);

	// 使用 cloudflare kv
	const key = `${ymonth}-record`;

	// 取得 kv 資料
	const value = await env.RECORD.get(key);

	let records = value ? JSON.parse(value) : [];

	// 新增資料
	records.push({
		name,
		status,
		createdAt: +new Date(),
	});

	// 更新 kv 資料，並設定過期時間 180 天
	await env.RECORD.put(key, JSON.stringify(records), { expirationTtl: 15552000 });

	return new Response('ok');
});


router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
