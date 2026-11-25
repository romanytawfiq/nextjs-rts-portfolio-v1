"use client";

import axios from "axios";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";

import { ghostButtonClass, primaryButtonClass } from "@/components/admin/ui";
import { sectionSchemas, type SectionKey } from "@/lib/schemas/cms";
import { useContentSave } from "@/lib/store/admin";

type FormValues = { json: string };

type QuickActionList = {
  titleKey: string;
  visibilityKey?: "visible" | "published";
  template: Record<string, unknown>;
  nested?: {
    key: string;
    titleKey: string;
    visibilityKey?: "visible" | "published";
    template: Record<string, unknown>;
  };
};

type EditorLabels = {
  save: string;
  reset: string;
  hint: string;
  saved: string;
  invalidJson: string;
  add?: string;
  remove?: string;
  up?: string;
  down?: string;
  visible?: string;
  hidden?: string;
  published?: string;
  unpublished?: string;
  notProvided?: string;
  actions?: string;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withUniqueKeys(value: Record<string, unknown>): Record<string, unknown> {
  const next = clone(value);
  const suffix = Date.now().toString(36);
  for (const key of ["slug", "key"] as const) {
    if (typeof next[key] === "string" && next[key]) {
      next[key] = `${next[key]}-${suffix}`;
    }
  }
  return next;
}

export function ContentEditor({
  section,
  values,
  labels,
  list,
}: {
  section: SectionKey;
  values: unknown;
  labels: EditorLabels;
  list?: QuickActionList;
}) {
  const serialized = JSON.stringify(values, null, 2);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState,
  } = useForm<FormValues>({
    defaultValues: { json: serialized },
  });
  const watchedJson = useWatch({ control, name: "json" }) ?? serialized;
  const { status, message, begin, success, failure, reset: resetStatus } = useContentSave();
  const quick = {
    add: labels.add ?? "Add",
    remove: labels.remove ?? "Remove",
    up: labels.up ?? "Up",
    down: labels.down ?? "Down",
    visible: labels.visible ?? "Visible",
    hidden: labels.hidden ?? "Hidden",
    published: labels.published ?? "Published",
    unpublished: labels.unpublished ?? "Unpublished",
    notProvided: labels.notProvided ?? "—",
    actions: labels.actions ?? "Actions",
  };

  const parsedList = useMemo<Record<string, unknown>[] | null>(() => {
    if (!list) return null;
    try {
      const parsed: unknown = JSON.parse(watchedJson);
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
    } catch {
      return null;
    }
  }, [list, watchedJson]);

  useEffect(() => {
    reset({ json: serialized });
    resetStatus();
  }, [serialized, reset, resetStatus]);

  function commit(next: Record<string, unknown>[]) {
    setValue("json", JSON.stringify(next, null, 2), { shouldDirty: true });
    resetStatus();
  }

  function updateAt(
    items: Record<string, unknown>[],
    index: number,
    update: (item: Record<string, unknown>) => Record<string, unknown>,
  ) {
    return items.map((item, itemIndex) => (itemIndex === index ? update(item) : item));
  }

  function move(items: Record<string, unknown>[], from: number, to: number) {
    if (to < 0 || to >= items.length) return items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function visibilityLabel(item: Record<string, unknown>, key?: "visible" | "published") {
    if (!key) return "";
    return item[key] === false
      ? key === "published"
        ? quick.unpublished
        : quick.hidden
      : key === "published"
        ? quick.published
        : quick.visible;
  }

  const onSubmit = handleSubmit(async ({ json }) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      failure(labels.invalidJson);
      return;
    }

    const result = sectionSchemas[section].safeParse(parsed);
    if (!result.success) {
      failure(result.error.issues[0]?.message ?? labels.invalidJson);
      return;
    }

    begin();
    try {
      await axios.patch("/api/admin/content", { section, values: result.data });
      reset({ json: JSON.stringify(result.data, null, 2) });
      success();
    } catch (error) {
      failure(
        axios.isAxiosError(error)
          ? `${error.response?.status ?? "network"}: ${JSON.stringify(error.response?.data ?? {})}`
          : labels.invalidJson,
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-line bg-surface p-5">
      <p className="text-xs text-muted">{labels.hint}</p>

      {list && parsedList && (
        <div className="mt-4 rounded-lg border border-line bg-background p-4">
          <p className="text-xs font-semibold text-foreground">{quick.actions}</p>
          <div className="mt-3 grid gap-2">
            {parsedList.map((item, index) => {
              const nested = list.nested;
              const nestedItems = nested
                ? Array.isArray(item[nested.key])
                  ? (item[nested.key] as Record<string, unknown>[])
                  : []
                : [];

              return (
                <div
                  key={`${String(item[list.titleKey] ?? index)}-${index}`}
                  className="rounded-lg border border-line p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm" dir="ltr">
                      {String(item[list.titleKey] ?? quick.notProvided)}
                    </span>
                    <button
                      type="button"
                      aria-label={quick.up}
                      title={quick.up}
                      disabled={index === 0}
                      onClick={() => commit(move(parsedList, index, index - 1))}
                      className={ghostButtonClass}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={quick.down}
                      title={quick.down}
                      disabled={index === parsedList.length - 1}
                      onClick={() => commit(move(parsedList, index, index + 1))}
                      className={ghostButtonClass}
                    >
                      ↓
                    </button>
                    {list.visibilityKey && (
                      <button
                        type="button"
                        onClick={() =>
                          commit(
                            updateAt(parsedList, index, (current) => ({
                              ...current,
                              [list.visibilityKey!]: current[list.visibilityKey!] === false,
                            })),
                          )
                        }
                        className={ghostButtonClass}
                      >
                        {visibilityLabel(item, list.visibilityKey)}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => commit(parsedList.filter((_, itemIndex) => itemIndex !== index))}
                      className={ghostButtonClass}
                    >
                      {quick.remove}
                    </button>
                  </div>

                  {nested && (
                    <div className="mt-3 grid gap-2 ps-4">
                      {nestedItems.map((nestedItem, nestedIndex) => (
                        <div
                          key={`${String(nestedItem[nested.titleKey] ?? nestedIndex)}-${nestedIndex}`}
                          className="flex flex-wrap items-center gap-2 text-xs"
                        >
                          <span className="min-w-0 flex-1 truncate" dir="ltr">
                            {String(nestedItem[nested.titleKey] ?? quick.notProvided)}
                          </span>
                          <button
                            type="button"
                            aria-label={quick.up}
                            title={quick.up}
                            disabled={nestedIndex === 0}
                            onClick={() =>
                              commit(
                                updateAt(parsedList, index, (current) => ({
                                  ...current,
                                  [nested.key]: move(nestedItems, nestedIndex, nestedIndex - 1),
                                })),
                              )
                            }
                            className={ghostButtonClass}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={quick.down}
                            title={quick.down}
                            disabled={nestedIndex === nestedItems.length - 1}
                            onClick={() =>
                              commit(
                                updateAt(parsedList, index, (current) => ({
                                  ...current,
                                  [nested.key]: move(nestedItems, nestedIndex, nestedIndex + 1),
                                })),
                              )
                            }
                            className={ghostButtonClass}
                          >
                            ↓
                          </button>
                          {nested.visibilityKey && (
                            <button
                              type="button"
                              onClick={() =>
                                commit(
                                  updateAt(parsedList, index, (current) => ({
                                    ...current,
                                    [nested.key]: updateAt(
                                      nestedItems,
                                      nestedIndex,
                                      (skill) => ({
                                        ...skill,
                                        [nested.visibilityKey!]:
                                          skill[nested.visibilityKey!] === false,
                                      }),
                                    ),
                                  })),
                                )
                              }
                              className={ghostButtonClass}
                            >
                              {visibilityLabel(nestedItem, nested.visibilityKey)}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              commit(
                                updateAt(parsedList, index, (current) => ({
                                  ...current,
                                  [nested.key]: nestedItems.filter(
                                    (_, skillIndex) => skillIndex !== nestedIndex,
                                  ),
                                })),
                              )
                            }
                            className={ghostButtonClass}
                          >
                            {quick.remove}
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          commit(
                            updateAt(parsedList, index, (current) => ({
                              ...current,
                              [nested.key]: [
                                ...nestedItems,
                                withUniqueKeys(clone(nested.template)),
                              ],
                            })),
                          )
                        }
                        className={ghostButtonClass}
                      >
                        + {quick.add}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => commit([...parsedList, withUniqueKeys(clone(list.template))])}
            className={`${ghostButtonClass} mt-3`}
          >
            + {quick.add}
          </button>
        </div>
      )}

      <textarea
        {...register("json")}
        dir="ltr"
        spellCheck={false}
        rows={12}
        className="mt-3 w-full rounded-lg border border-line bg-background px-3 py-2.5 font-mono text-xs leading-5 text-foreground focus:border-accent focus:outline-none"
      />
      {status === "error" && message && (
        <p className="mt-3 break-words text-xs text-accent" dir="ltr">
          {message}
        </p>
      )}
      {status === "saved" && <p className="mt-3 text-xs text-emerald-600">{labels.saved}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" disabled={status === "saving"} className={primaryButtonClass}>
          {status === "saving" ? "…" : labels.save}
        </button>
        <button type="button" onClick={() => reset({ json: serialized })} className={ghostButtonClass}>
          {labels.reset}
        </button>
      </div>
      {formState.isDirty && <p className="mt-3 text-xs text-muted">●</p>}
    </form>
  );
}
