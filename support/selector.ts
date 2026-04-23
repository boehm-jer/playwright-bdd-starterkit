export type Selector =
  | { kind: 'role';     role: string;  options?: { name?: string; exact?: boolean } }
  | { kind: 'testId';   id: string }
  | { kind: 'css';      css: string }
  | { kind: 'text';     text: string;  exact?: boolean }
  | { kind: 'label';    label: string }
  | { kind: 'title';    title: string }
  | { kind: 'ariaLabel'; label: string };

export const by = {
  role:     (role: string, options?: { name?: string; exact?: boolean }): Selector => ({ kind: 'role', role, options }),
  testId:   (id: string): Selector =>                                                  ({ kind: 'testId', id }),
  css:      (css: string): Selector =>                                                 ({ kind: 'css', css }),
  text:     (text: string, exact?: boolean): Selector =>                              ({ kind: 'text', text, exact }),
  label:    (label: string): Selector =>                                               ({ kind: 'label', label }),
  title:    (title: string): Selector =>                                               ({ kind: 'title', title }),
  ariaLabel:(label: string): Selector =>                                               ({ kind: 'ariaLabel', label }),
};
