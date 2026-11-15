// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Served by GitHub Pages at https://mikepage.github.io/robinmail-docs/.
export default defineConfig({
	site: 'https://mikepage.github.io',
	base: '/robinmail-docs',
	integrations: [
		starlight({
			title: 'robinmail',
			description: 'Documentation of robinmail, a JMAP-first mail server in Go. A learning project.',
			social: [{ icon: 'github', label: 'robinmail on GitHub', href: 'https://github.com/mikepage/robinmail' }],
			editLink: { baseUrl: 'https://github.com/mikepage/robinmail-docs/edit/main/' },
			lastUpdated: true,
			sidebar: [
				{
					label: 'Introduction',
					items: [
						{ label: 'What robinmail is', slug: 'index' },
						{ label: 'What it is not', slug: 'introduction/limits' },
					],
				},
				{
					label: 'Getting started',
					items: [
						{ label: 'A development instance', slug: 'getting-started/dev-instance' },
						{ label: 'A mail program', slug: 'getting-started/mail-program' },
						{ label: 'Live reload', slug: 'getting-started/live-reload' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Overview', slug: 'architecture/overview' },
						{ label: 'Metadata in rqlite', slug: 'architecture/rqlite' },
						{ label: 'Message files', slug: 'architecture/blobs' },
						{ label: 'A cluster', slug: 'architecture/cluster' },
						{ label: 'Protocols', slug: 'architecture/protocols' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Configuration', slug: 'reference/configuration' },
						{ label: 'Commands', slug: 'reference/commands' },
						{ label: 'DNS records', slug: 'reference/dns' },
					],
				},
				{ label: 'Webmail', slug: 'webmail' },
				{ label: 'Testing', slug: 'testing' },
				{ label: 'Security model', slug: 'security' },
				{ label: 'Compared with mox', slug: 'mox' },
				{ label: 'Roadmap', slug: 'roadmap' },
			],
		}),
	],
});
