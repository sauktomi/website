---
title: "{{ replace .Name "-" " " | title }}"
adminOnly: true
_build:
  render: true
  list: true
  publishResources: true
---
{{ partial "admin-check" . }}
