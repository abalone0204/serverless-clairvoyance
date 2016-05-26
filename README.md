# Clairvoyance - Back-end

- Serverless

# Tables

- `Comments`:

```js
{
    PRIMARY(id),
    SORT(job_id),
    comment,
    source,
    [positive_tag],
    [negative_tag]
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