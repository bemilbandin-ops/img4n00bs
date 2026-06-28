import { ArrowLeft, BookOpen } from 'lucide-react';
import { conceptDocs } from '../data/concepts';
import { toolGroups } from '../data/tools';
import { workflows } from '../data/workflows';

export default function HelpWikiPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-zinc-900 pb-5">
          <a href="#/" className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to editor
          </a>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black"><BookOpen className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Help Wiki</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">Learn by goal, by tool, or by concept.</p>
            </div>
          </div>
        </header>

        <section id="wiki-learn-by-goal" className="grid gap-3">
          <h2 className="text-lg font-bold text-white">Learn by goal</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {workflows.map(workflow => (
              <article key={workflow.id} className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                <h3 className="text-base font-bold text-white">{workflow.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{workflow.description}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-500">
                  {workflow.steps.map(step => <li key={step.id}>{step.title}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section id="wiki-learn-by-tool" className="grid gap-5">
          <h2 className="text-lg font-bold text-white">Learn by tool</h2>
          {toolGroups.map(group => (
            <section key={group.title} className="grid gap-3">
              <h3 className="text-base font-bold text-white">{group.title}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {group.tools.map(tool => (
                  <article key={tool.id} className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <h4 className="text-base font-bold text-white">{tool.beginnerName}</h4>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{tool.shortDescription}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.whenToUse}</p>
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-400">
                      {tool.steps.map(step => <li key={step}>{step}</li>)}
                    </ol>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section id="wiki-concepts" className="grid gap-3">
          <h2 className="text-lg font-bold text-white">Concepts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {conceptDocs.map(concept => (
              <article key={concept.id} className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                <h3 className="text-base font-bold text-white">{concept.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{concept.plainMeaning}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{concept.whenItMatters}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
