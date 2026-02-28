<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import SprintFocus from '$lib/components/SprintFocus.svelte';
    import RotationStatus from '$lib/components/RotationStatus.svelte';
    import SyncStatus from '$lib/components/SyncStatus.svelte';
    import type { PageData } from './$types';

    let { data } = $props<{ data: PageData }>();
    let sprint = $derived(data.sprint ?? null);
    let rotation = $derived((data as any).rotation ?? null);
    let activeProjectName = $derived(
        sprint?.project_id
            ? (data.projects as { id: string; name: string }[]).find((p) => p.id === sprint!.project_id)?.name ?? sprint!.project_id
            : ''
    );

    type Review = {
        id: string;
        cardId: string;
        comment: string;
        author: string | null;
        type: string;
        createdAt: string;
    };

    type Card = {
        id: string;
        columnId: string;
        title: string;
        description: string | null;
        projectId: string | null;
        tags: string[];
        position: number;
        createdAt: string;
        reviews: Review[];
        reviewCount: number;
        lastReviewAt: string | null;
        lastReviewer: string | null;
    };

    type Column = { id: string; title: string; position: number; cards: Card[] };
    type Project = { id: string; name: string; color: string };

    let columns = $derived(data.columns as Column[]);
    let projects = $derived(data.projects as Project[]);
    let selectedProjects = $derived(((data.selectedProjects as string[] | undefined) ?? []) as string[]);
    let selectedProjectsSet = $derived(new Set(selectedProjects));
    let dragging: { card: Card; fromColumnId: string } | null = $state(null);
    let addingTo: string | null = $state(null);
    let selectedCard: Card | null = $state(null);

    function projectColor(pid: string | null): string {
        if (!pid) return '#9ca3af';
        return projects.find((p) => p.id === pid)?.color ?? '#9ca3af';
    }

    function projectName(pid: string | null): string {
        if (!pid) return '';
        return projects.find((p) => p.id === pid)?.name ?? pid;
    }

    function buildProjectQuery(ids: string[]) {
        if (!ids.length) return '/';
        const params = new URLSearchParams();
        ids.forEach((id) => params.append('project', id));
        return `?${params.toString()}`;
    }

    function updateProjectSelection(ids: string[]) {
        goto(buildProjectQuery(ids), { replaceState: true });
    }

    function toggleProject(pid: string) {
        const current = new Set(selectedProjects);
        if (current.has(pid)) {
            current.delete(pid);
        } else {
            current.add(pid);
        }
        updateProjectSelection(Array.from(current));
    }

    function showAllProjects() {
        updateProjectSelection([]);
    }

    function onDragStart(e: DragEvent, card: Card, fromColumnId: string) {
        dragging = { card, fromColumnId };
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.id);
        }
    }

    function allowDrop(e: DragEvent) {
        e.preventDefault();
    }

    function onDrop(e: DragEvent, toColumnId: string) {
        e.preventDefault();
        if (!dragging || dragging.fromColumnId === toColumnId) {
            dragging = null;
            return;
        }
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '?/move';
        form.style.display = 'none';
        const fields = { cardId: dragging.card.id, toColumnId, toPosition: '0' };
        for (const [k, v] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.name = k;
            input.value = v;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        dragging = null;
    }

    function handleCardClick(event: MouseEvent, card: Card) {
        if (dragging) {
            dragging = null;
            return;
        }
        if ((event.target as HTMLElement).closest('button, form, input, textarea, select')) {
            return;
        }
        openCardDetails(card);
    }

    function openCardDetails(card: Card) {
        selectedCard = card;
    }

    function closeCardDetails() {
        selectedCard = null;
    }

    function formatTimestamp(value: string | null): string {
        if (!value) return '';
        try {
            return new Date(value).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch {
            return value;
        }
    }

    function reviewBadgeLabel(card: Card): string {
        return card.reviewCount ? 'Reviewed' : 'Needs review';
    }

    function reviewStat(card: Card): string {
        if (card.reviewCount) {
            return `${card.reviewCount} review${card.reviewCount > 1 ? 's' : ''}`;
        }
        return 'Awaiting review';
    }
</script>

<svelte:head>
    <title>TML PM — Kanban</title>
</svelte:head>

<main>
    <header>
        <div>
            <h1>📋 Kanban Board</h1>
            <p class="subtitle">More warmth, more context, fewer stale columns.</p>
        </div>
        <nav class="nav">
            <a href="/ideas">Ideas</a>
            <a href="/timeline">Timeline</a>
        </nav>
    </header>

    <div class="filters">
        <button class="filterBtn" class:active={selectedProjects.length === 0} type="button" onclick={showAllProjects}>All</button>
        {#each projects as proj (proj.id)}
            <button
                type="button"
                class="filterBtn multi"
                class:active={selectedProjectsSet.has(proj.id)}
                onclick={() => toggleProject(proj.id)}
                style="--proj-color: {proj.color}"
            >
                <span class="dot" style="background: {proj.color}"></span>
                {proj.name}
            </button>
        {/each}
    </div>

    <RotationStatus {rotation} />
    <SyncStatus />
    <p class="miniLinks">
        <a href="/sync">Sync Explorer →</a>
    </p>
    <SprintFocus {sprint} projectName={activeProjectName} />

    <section class="board">
        {#each columns as col (col.id)}
            <div
                class="col"
                role="list"
                aria-label={col.title}
                ondragover={allowDrop}
                ondrop={(e) => onDrop(e, col.id)}
            >
                <div class="colHeader">
                    <div>
                        <p class="mutedTag">{col.title}</p>
                        <h2>{col.title}</h2>
                    </div>
                    <span class="count">{col.cards.length}</span>
                </div>

                <div class="cards">
                    {#each col.cards as card (card.id)}
                        <div
                            class="card"
                            role="button"
                            tabindex="0"
                            aria-label={`Open details for ${card.title}`}
                            draggable="true"
                            ondragstart={(e) => onDragStart(e, card, col.id)}
                            onclick={(event) => handleCardClick(event, card)}
                            onkeydown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    openCardDetails(card);
                                }
                            }}
                        >
                            <div class="cardTop">
                                <div class="title">{card.title}</div>
                                <form method="POST" action="?/delete" use:enhance>
                                    <input type="hidden" name="cardId" value={card.id} />
                                    <button type="submit" class="deleteBtn" title="Delete card" onclick={(event) => event.stopPropagation()}>×</button>
                                </form>
                            </div>
                            {#if card.projectId}
                                <span class="projBadge" style="background: {projectColor(card.projectId)}">
                                    {projectName(card.projectId)}
                                </span>
                            {/if}
                            <div class="cardBadges">
                                <span class={`badge ${card.reviewCount ? 'reviewed' : 'pending'}`}>
                                    {reviewBadgeLabel(card)}
                                </span>
                                <span class="badge stat">{reviewStat(card)}</span>
                                {#if card.lastReviewer}
                                    <span class="badge reviewer">{card.lastReviewer}</span>
                                {/if}
                            </div>
                            {#if card.description}
                                <p class="desc">{card.description}</p>
                            {/if}
                            {#if card.tags?.length}
                                <div class="tags">
                                    {#each card.tags as t}
                                        <span class="tag">{t}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                {#if addingTo === col.id}
                    <form method="POST" action="?/create" class="addForm" use:enhance={() => {
                        return async ({ update }) => {
                            addingTo = null;
                            await update();
                        };
                    }}>
                        <input type="hidden" name="columnId" value={col.id} />
                        <input name="title" placeholder="Card title…" required autocomplete="off" class="addInput" />
                        <input name="description" placeholder="Description (optional)" class="addInput" />
                        <select name="projectId" class="addInput">
                            <option value="">No project</option>
                            {#each projects as proj}
                                <option value={proj.id}>{proj.name}</option>
                            {/each}
                        </select>
                        <input name="tags" placeholder="Tags (comma-separated)" class="addInput tagInput" />
                        <div class="addActions">
                            <button type="submit">Add</button>
                            <button type="button" class="secondary" onclick={() => (addingTo = null)}>Cancel</button>
                        </div>
                    </form>
                {:else}
                    <button class="addBtn" onclick={() => (addingTo = col.id)}>+ Add card</button>
                {/if}
            </div>
        {/each}
    </section>

    {#if selectedCard}
        <div class="modalOverlay">
            <div
                class="modalBackdrop"
                role="button"
                tabindex="0"
                aria-label="Close card details"
                onclick={closeCardDetails}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        closeCardDetails();
                    }
                }}
            ></div>
            <div class="modal" role="dialog" aria-modal="true">
                <header class="modalHeader">
                    <div>
                        <p class="mutedTag">Card context</p>
                        <h3>{selectedCard.title}</h3>
                        <p class="modalMeta">
                            <span>{projectName(selectedCard.projectId) || 'General'}</span>
                            <span>Created {formatTimestamp(selectedCard.createdAt)}</span>
                        </p>
                    </div>
                    <button type="button" class="modalClose" onclick={closeCardDetails} aria-label="Close details">×</button>
                </header>

                <section class="modalBody">
                    {#if selectedCard.description}
                        <p class="desc">{selectedCard.description}</p>
                    {:else}
                        <p class="muted">No description yet — feel free to add more context.</p>
                    {/if}
                    {#if selectedCard.tags?.length}
                        <div class="tags modalTags">
                            {#each selectedCard.tags as tag}
                                <span class="tag">{tag}</span>
                            {/each}
                        </div>
                    {/if}
                </section>

                <section class="modalReviews">
                    <div class="sectionHeader">
                        <div>
                            <h4>Reviews & notes</h4>
                            <p class="muted">{selectedCard.reviewCount} logged entries</p>
                        </div>
                        <span class="badge stat">{reviewStat(selectedCard)}</span>
                    </div>
                    {#if selectedCard.reviews.length}
                        <ul class="reviewList">
                            {#each selectedCard.reviews as review (review.id)}
                                <li>
                                    <div class="reviewHeader">
                                        <strong>{review.author ?? 'Tim'}</strong>
                                        <time>{formatTimestamp(review.createdAt)}</time>
                                    </div>
                                    <p>{review.comment}</p>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p class="muted">No reviews yet — add the first thoughtful note after a work session.</p>
                    {/if}
                </section>

                <section class="modalForm">
                    <div class="sectionHeader">
                        <div>
                            <h4>Add a review</h4>
                            <p class="muted">Keep the Review column honest by noting why the card earned your attention.</p>
                        </div>
                    </div>
                    <form
                        method="POST"
                        action="?/review"
                        class="reviewForm"
                        use:enhance={() => {
                            return async ({ update }) => {
                                selectedCard = null;
                                await update();
                            };
                        }}
                    >
                        <input type="hidden" name="cardId" value={selectedCard.id} />
                        <label>
                            <span>Author</span>
                            <input name="author" placeholder="Name (optional)" class="addInput" />
                        </label>
                        <label>
                            <span>Type</span>
                            <select name="type" class="addInput">
                                <option value="review">Review</option>
                                <option value="note">Note</option>
                            </select>
                        </label>
                        <label>
                            <span>Comment</span>
                            <textarea
                                name="comment"
                                rows="4"
                                required
                                placeholder="Add your thoughts, blockers, or handoff notes..."
                            ></textarea>
                        </label>
                        <div class="reviewActions">
                            <button type="submit">Save note</button>
                            <button type="button" class="secondary" onclick={closeCardDetails}>Cancel</button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    {/if}
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        background: radial-gradient(circle at top, #111827 0%, #0b1220 45%, #05060a 100%);
        color: #f8fafc;
        min-height: 100vh;
    }

    :global(*) {
        box-sizing: border-box;
    }

    main {
        padding: 2rem clamp(1rem, 3vw, 2.5rem) 3rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    header h1 {
        margin: 0;
        font-size: 1.9rem;
    }

    .subtitle {
        margin: 0;
        color: #cbd5f5;
        font-size: 0.95rem;
    }

    .nav {
        display: flex;
        gap: 0.75rem;
    }

    .nav a {
        color: #e0e7ff;
        text-decoration: none;
        font-weight: 600;
    }

    .nav a:hover {
        text-decoration: underline;
    }

    .filters {
        display: flex;
        gap: 8px;
        margin-top: 1.25rem;
        flex-wrap: wrap;
    }

    .filterBtn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(226, 232, 240, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.4);
        color: #e2e8f0;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
    }

    .filterBtn:hover {
        border-color: rgba(149, 196, 253, 0.7);
    }

    .filterBtn.active {
        background: #1d4ed8;
        color: #fff;
        border-color: #1d4ed8;
    }

    .filterBtn.multi {
        min-width: 130px;
        justify-content: flex-start;
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        border: 2px solid transparent;
    }

    .board {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
        margin-top: 1.5rem;
        align-items: flex-start;
    }

    .col {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 18px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        min-height: 320px;
        box-shadow: 0 15px 35px rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(16px);
    }

    .colHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .colHeader h2 {
        margin: 0;
        font-size: 1.15rem;
    }

    .count {
        font-size: 0.85rem;
        background: rgba(148, 163, 184, 0.15);
        border-radius: 999px;
        padding: 4px 10px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        color: #e0f2fe;
    }

    .cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
    }

    .card {
        background: linear-gradient(180deg, rgba(59, 68, 116, 0.9), rgba(15, 23, 42, 0.9));
        border-radius: 14px;
        padding: 14px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        cursor: grab;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: transform 0.2s, box-shadow 0.3s;
        box-shadow: 0 12px 25px rgba(15, 23, 42, 0.45);
    }

    .card:active {
        cursor: grabbing;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 30px rgba(15, 23, 42, 0.55);
    }

    .cardTop {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .title {
        font-size: 1rem;
        font-weight: 700;
        line-height: 1.2;
        color: #f8fafc;
    }

    .deleteBtn {
        background: rgba(148, 163, 184, 0.2);
        border: 0;
        color: #e0e7ff;
        font-size: 1.1rem;
        line-height: 1;
        border-radius: 6px;
        padding: 0 6px;
        cursor: pointer;
    }

    .deleteBtn:hover {
        background: rgba(248, 113, 113, 0.3);
        color: #fecaca;
    }

    .projBadge {
        display: inline-block;
        margin-top: 2px;
        font-size: 0.7rem;
        font-weight: 700;
        color: #0f172a;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
    }

    .cardBadges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .badge {
        font-size: 0.7rem;
        padding: 2px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .badge.reviewed {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.4);
        color: #5eead4;
    }

    .badge.pending {
        background: rgba(248, 113, 113, 0.15);
        border-color: rgba(248, 113, 113, 0.4);
        color: #fecaca;
    }

    .badge.stat {
        background: rgba(14, 165, 233, 0.15);
        border-color: rgba(14, 165, 233, 0.4);
        color: #bae6fd;
    }

    .badge.reviewer {
        background: rgba(251, 191, 36, 0.2);
        border-color: rgba(251, 191, 36, 0.4);
        color: #fde68a;
    }

    .desc {
        margin: 0;
        color: #cbd5f5;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .tag {
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #bfdbfe;
    }

    .addBtn {
        margin-top: 12px;
        background: rgba(56, 189, 248, 0.15);
        border: 1px dashed rgba(56, 189, 248, 0.8);
        border-radius: 10px;
        padding: 10px;
        color: #bae6fd;
        cursor: pointer;
        font-weight: 600;
    }

    .addBtn:hover {
        border-style: solid;
    }

    .addForm {
        margin-top: 12px;
        display: grid;
        gap: 8px;
        background: rgba(148, 163, 184, 0.05);
        padding: 12px;
        border-radius: 12px;
    }

    .addInput,
    select.addInput,
    textarea {
        width: 100%;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(15, 23, 42, 0.7);
        color: #e2e8f0;
        font: inherit;
    }

    .addInput::placeholder,
    textarea::placeholder {
        color: rgba(226, 232, 240, 0.6);
    }

    .addActions {
        display: flex;
        gap: 8px;
    }

    button {
        border-radius: 10px;
        border: none;
        padding: 8px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s;
    }

    button.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #9ca3af;
        border: 1px solid rgba(148, 163, 184, 0.4);
    }

    button:not(.secondary) {
        background: #2563eb;
        color: #fff;
    }

    button:hover {
        transform: translateY(-1px);
    }

    .miniLinks {
        margin-top: 0.5rem;
        color: #a5b4fc;
        font-size: 0.85rem;
    }

    .miniLinks a {
        color: inherit;
    }

    .muted {
        color: rgba(226, 232, 240, 0.7);
        margin: 0;
        font-size: 0.95rem;
    }

    .mutedTag {
        margin: 0;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(148, 163, 184, 0.9);
    }

    .modalOverlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 20;
    }

    .modalBackdrop {
        position: absolute;
        inset: 0;
        background: rgba(2, 6, 23, 0.7);
        border-radius: 24px;
        cursor: pointer;
        z-index: 0;
        transition: background 0.2s ease;
    }

    .modalBackdrop:focus-visible {
        outline: 2px solid rgba(59, 130, 246, 0.9);
        outline-offset: 2px;
    }

    .modal {
        position: relative;
        z-index: 1;
        background: rgba(15, 23, 42, 0.98);
        border-radius: 20px;
        padding: 1.5rem;
        width: min(640px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(2, 6, 23, 0.8);
        border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .modalHeader {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
    }

    .modalHeader h3 {
        margin: 0;
        font-size: 1.4rem;
    }

    .modalMeta {
        display: flex;
        gap: 12px;
        margin: 6px 0 0;
        color: rgba(226, 232, 240, 0.7);
        font-size: 0.85rem;
    }

    .modalClose {
        background: none;
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 12px;
        color: #e2e8f0;
        font-size: 1.4rem;
        line-height: 1;
        padding: 0 10px;
    }

    .modalBody {
        margin-top: 1rem;
    }

    .modalTags {
        margin-top: 0.5rem;
    }

    .modalReviews,
    .modalForm {
        margin-top: 1.25rem;
        background: rgba(148, 163, 184, 0.05);
        padding: 1rem;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .sectionHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .sectionHeader h4 {
        margin: 0;
    }

    .reviewList {
        list-style: none;
        padding: 0;
        margin: 0;
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }

    .reviewList li {
        padding: 0.85rem;
        background: rgba(15, 23, 42, 0.6);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .reviewHeader {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: rgba(226, 232, 240, 0.8);
        margin-bottom: 0.35rem;
    }

    .reviewHeader strong {
        color: #f8fafc;
    }

    .reviewForm label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.85rem;
        color: #e2e8f0;
    }

    .reviewForm textarea {
        min-height: 100px;
        resize: vertical;
    }

    .reviewActions {
        margin-top: 0.75rem;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    @media (max-width: 720px) {
        header {
            flex-direction: column;
            align-items: flex-start;
        }

        .board {
            grid-template-columns: 1fr;
        }
    }
</style>
