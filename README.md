# Clairvoyance - Back-end

- Serverless

# Tables

- `Comments`:

```js
{
    PRIMARY(id),
    GSI(job_id),
    content,
    GSI(source),
    positive_tags: [positive_tag],
    negative_tags: [negative_tag]
}
```

- `Jobs`:

```js
{
    PRIMARY(id)
    GSI(company_name),
    GSI(job_name)
}
```