// src/components/FileListItem.ts
import m from "mithril";

interface FileListItemAttrs {
  name: string;
}

export const FileListItem: m.Component<FileListItemAttrs> = {
  view: ({ attrs }) =>
    m(
      "div",
      {
        style:
          "margin-left: 1.5rem; font-size: 0.9em; color: #555; display: flex; align-items: center;",
      },
      [
        m(
          "span.material-symbols-outlined",
          {
            style: "font-size: 16px; color: #757575; margin-right: 4px;",
          },
          "draft",
        ),
        attrs.name,
      ],
    ),
};
