import z from "zod";
export const z_person = z.object({
  object: z.literal("user"),
  id: z.string().uuid(),
});

export const z_people = z.object({
  id: z.string(),
  type: z.literal("people"),
  people: z.array(z_person),
});

export const z_unique_id = z.object({
  id: z.string(),
  type: z.literal("unique_id"),
  unique_id: z.object({
    prefix: z.string(),
    number: z.number(),
  }),
});

export const z_status = z.object({
  id: z.string(),
  type: z.literal("status"),
  status: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  }),
});

export const z_relation = z.object({
  id: z.string(),
  type: z.literal("relation"),
  relation: z
    .object({
      id: z.string().uuid(),
    })
    .array(),
  has_more: z.boolean(),
});

export const z_date = z.object({
  id: z.string(),
  type: z.literal("date"),
  date: z
    .object({
      start: z.string(),
      end: z.string().nullable(),
      time_zone: z.any().nullable(),
    })
    .nullable(),
});

export const z_title = z.object({
  id: z.string(),
  type: z.literal("title"),
  title: z
    .object({
      plain_text: z.string(),
      href: z.string().nullable(),
    })
    .array(),
});

export const z_icon = z.union([
  z.object({
    type: z.literal("external"),
    external: z.object({
      url: z.string().url(),
    }),
  }),
  z.object({
    type: z.literal("emoji"),
    emoji: z.string(),
  }),
]);

export const z_number = z.object({
  id: z.string(),
  type: z.literal("number"),
  number: z.number(),
});

export const z_rich_text = z.object({
  id: z.string(),
  type: z.literal("rich_text"),
  rich_text: z
    .object({
      type: z.string(),
      text: z.object({
        content: z.string(),
        link: z.any().nullable(),
      }),
      plain_text: z.string(),
      href: z.string().nullable(),
    })
    .array(),
});

export const z_task = z.object({
  id: z.string().uuid(),
  created_time: z.string().optional(),
  icon: z_icon.nullable(),
  properties: z.object({
    Author: z_people,
    "Blocked by": z_relation,
    "Rush/Must": z.any(),
    Reviewer: z_people,
    ID: z_unique_id,

    "Task name": z_title,
    Assignee: z_people,
    Status: z_status,
    Deadline: z_date,
    "Sub-tasks": z_relation,
    "Parent-task": z_relation,
    Sprint: z_relation,
    "GitHub Pull Requests": z_relation,
  }),
  url: z.string().url(),
});

export const z_pull_request = z.object({
  id: z.string().uuid(),
  created_time: z.string().optional(),
  icon: z_icon.nullable(),
  properties: z.object({
    State: z_relation,
    Title: z_title,
    "PR Number": z_number,
    Description: z_rich_text,
    Tasks: z_relation,
  }),
  url: z.string().url(),
});

export function get_icon(icon: z.infer<typeof z_icon>) {
  return icon.type === "external" ? icon.external.url : icon.emoji;
}
