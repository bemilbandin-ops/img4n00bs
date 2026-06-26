/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, BookOpen } from 'lucide-react';
import { toolHelp } from '../data/toolHelp';
import { toolbarToolGroups } from './Toolbar';

export default function HelpWikiPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-zinc-900 pb-5">
          <a
            href="#/"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </a>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Help Wiki</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                A simple guide to each tool in the editor: what it is for, how to use it, and the mistake to check first.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5">
          {toolbarToolGroups.map(group => (
            <section key={group.title} className="grid gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">{group.title}</h2>
                <p className="text-sm text-zinc-500">{group.note}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.tools.map(tool => {
                  const help = toolHelp[tool.id];

                  return (
                    <article key={tool.id} className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-zinc-900 p-2 text-zinc-300">{tool.icon}</div>
                        <div>
                          <h3 className="text-base font-bold text-white">{tool.label}</h3>
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{tool.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-zinc-300">{tool.desc}</p>
                      {help && (
                        <>
                          <p className="mt-3 text-sm leading-6 text-zinc-400">{help.summary}</p>
                          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-400">
                            {help.steps.map(step => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                          {help.mistake && (
                            <p className="mt-3 rounded-md border border-zinc-800 bg-black p-3 text-sm leading-6 text-zinc-400">
                              <span className="font-bold text-zinc-200">First check:</span> {help.mistake}
                            </p>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
