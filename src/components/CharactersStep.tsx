'use client'

import { useRef, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import { MAX_MEMORIES } from '@/lib/types'
import type { Character, CharacterKind, MemoryPhoto } from '@/lib/types'
import { Button, Field, TextArea, TextInput } from './ui'

export function CharactersStep({
  dict,
  characters,
  onChange,
  memories,
  onMemoriesChange,
}: {
  dict: Dictionary
  characters: Character[]
  onChange: (characters: Character[]) => void
  memories: MemoryPhoto[]
  onMemoriesChange: (memories: MemoryPhoto[]) => void
}) {
  const copy = dict.wizard.characters

  const update = (id: string, patch: Partial<Character>) =>
    onChange(characters.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const add = (kind: CharacterKind) =>
    onChange([
      ...characters,
      {
        id: `c${Date.now().toString(36)}`,
        name: '',
        kind,
        traits: '',
      },
    ])

  return (
    <div className="space-y-5">
      {characters.map((character, i) => (
        <article
          key={character.id}
          className="rounded-2xl border border-line bg-paper-raised p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">
              {character.name.trim() ||
                (character.kind === 'pet' ? copy.pet : copy.person)}{' '}
              <span className="text-ink-soft">#{i + 1}</span>
            </h2>
            {characters.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange(characters.filter((c) => c.id !== character.id))
                }
                className="text-sm text-ink-soft underline underline-offset-4 hover:text-accent"
              >
                {copy.remove}
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={copy.name}>
              <TextInput
                value={character.name}
                maxLength={60}
                placeholder={copy.namePlaceholder}
                onChange={(name) => update(character.id, { name })}
              />
            </Field>

            <Field label={copy.kind}>
              <div className="flex gap-2">
                {(['person', 'pet'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => update(character.id, { kind })}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
                      character.kind === kind
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-paper-raised text-ink-soft hover:border-accent/50'
                    }`}
                  >
                    {kind === 'person' ? copy.person : copy.pet}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={copy.role}>
              <TextInput
                value={character.role ?? ''}
                maxLength={120}
                placeholder={copy.rolePlaceholder}
                onChange={(role) => update(character.id, { role })}
              />
            </Field>

            <Field label={copy.age}>
              <TextInput
                value={character.age ?? ''}
                maxLength={60}
                placeholder={copy.agePlaceholder}
                onChange={(age) => update(character.id, { age })}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label={copy.traits}>
              <TextArea
                value={character.traits}
                rows={3}
                maxLength={1200}
                placeholder={copy.traitsPlaceholder}
                onChange={(traits) => update(character.id, { traits })}
              />
            </Field>
          </div>

          <div className="mt-4">
            <PhotoUpload
              dict={dict}
              photoUrls={character.photoUrls ?? []}
              onChange={(photoUrls) => update(character.id, { photoUrls })}
            />
          </div>
        </article>
      ))}

      {characters.length < 6 && (
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => add('person')}>
            + {copy.add}
          </Button>
          <Button variant="ghost" onClick={() => add('pet')}>
            + {copy.addPet}
          </Button>
        </div>
      )}

      <MemoriesBlock
        dict={dict}
        memories={memories}
        onChange={onMemoriesChange}
      />
    </div>
  )
}

/**
 * Photographs that become pages.
 *
 * Deliberately set apart from the character cards above, because it is the
 * opposite kind of upload and confusing the two would waste the customer's
 * time: those photos teach the model a face and are never printed, while these
 * are printed — the moment in them becomes a page of the story.
 */
function MemoriesBlock({
  dict,
  memories,
  onChange,
}: {
  dict: Dictionary
  memories: MemoryPhoto[]
  onChange: (memories: MemoryPhoto[]) => void
}) {
  const copy = dict.wizard.memories
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(files: File[]) {
    setBusy(true)
    setError(null)
    try {
      const room = MAX_MEMORIES - memories.length
      const added: MemoryPhoto[] = []

      for (const file of files.slice(0, room)) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/uploads', { method: 'POST', body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? dict.common.error)
        added.push({ id: `m${Date.now().toString(36)}${added.length}`, url: data.url, note: '' })
      }

      onChange([...memories, ...added])
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-line bg-paper-raised/60 p-5">
      <h2 className="font-serif text-lg text-ink">{copy.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{copy.subtitle}</p>

      {memories.length > 0 && (
        <ul className="mt-4 space-y-4">
          {memories.map((memory) => (
            <li key={memory.id} className="flex gap-4">
              {/* Plain <img>: a customer upload from our own API route. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={memory.url}
                alt=""
                className="size-24 shrink-0 rounded-xl border border-line object-cover"
              />
              <div className="min-w-0 flex-1">
                <TextArea
                  value={memory.note}
                  rows={3}
                  placeholder={copy.notePlaceholder}
                  onChange={(note) =>
                    onChange(
                      memories.map((m) =>
                        m.id === memory.id ? { ...m, note } : m,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(memories.filter((m) => m.id !== memory.id))
                  }
                  className="mt-1.5 text-xs text-ink-soft underline-offset-2 hover:text-accent hover:underline"
                >
                  {copy.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {memories.length < MAX_MEMORIES && (
        <div className="mt-4">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy
              ? dict.common.loading
              : memories.length === 0
                ? copy.add
                : copy.addAnother}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) void upload(files)
          e.target.value = ''
        }}
      />

      <p className="mt-2 text-xs text-ink-soft">{copy.hint}</p>
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </section>
  )
}

/** Three is where extra angles stop adding information about a face. */
const MAX_PHOTOS = 3

function PhotoUpload({
  dict,
  photoUrls,
  onChange,
}: {
  dict: Dictionary
  photoUrls: string[]
  onChange: (urls: string[]) => void
}) {
  const copy = dict.wizard.characters
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(files: File[]) {
    setBusy(true)
    setError(null)
    try {
      const room = MAX_PHOTOS - photoUrls.length
      const uploaded: string[] = []

      for (const file of files.slice(0, room)) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/uploads', { method: 'POST', body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? dict.common.error)
        uploaded.push(data.url)
      }

      onChange([...photoUrls, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {copy.photo}{' '}
        <span className="font-normal text-ink-soft">({dict.common.optional})</span>
      </span>

      <div className="flex flex-wrap items-center gap-3">
        {photoUrls.map((url, i) => (
          <span key={url} className="relative">
            {/* Plain <img>: user uploads served from our own API route, and
                next/image's optimiser adds nothing for a 64px thumbnail. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="size-16 rounded-xl border border-line object-cover"
            />
            <button
              type="button"
              aria-label={copy.removePhoto}
              onClick={() => onChange(photoUrls.filter((_, j) => j !== i))}
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-line bg-paper-raised text-xs leading-none text-ink-soft hover:text-accent"
            >
              ×
            </button>
          </span>
        ))}

        {photoUrls.length < MAX_PHOTOS && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy
              ? dict.common.loading
              : photoUrls.length === 0
                ? copy.upload
                : copy.addPhoto}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) void upload(files)
          e.target.value = ''
        }}
      />

      <p className="mt-1.5 text-xs text-ink-soft">{copy.photoHint}</p>
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </div>
  )
}
