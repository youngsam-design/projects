# Project content blocks

Project descriptions live in this directory as versioned block documents. The
React application renders the descriptions from these files. Legacy HTML is
still used temporarily for each project's title/hero shell.

## Schema

Each document contains a schema version, project slug, and ordered blocks.

```json
{
  "schemaVersion": 1,
  "slug": "insight-renewal",
  "blocks": []
}
```

Every node has a stable `id`. Text nodes store editable text in `value`, while
element nodes store their semantic HTML tag, attributes, and nested children.
This preserves the existing page design while keeping content serializable for
a future block editor.

## Migration

Run `npm run migrate:content` only when intentionally re-importing the legacy
HTML. It overwrites the generated JSON documents, so direct JSON edits should
be committed before running it.

## Editor boundary

An editor should read and write this schema through a content repository layer
rather than importing JSON files directly. That boundary will allow local JSON
storage to be replaced by an API or database without changing the renderer.
