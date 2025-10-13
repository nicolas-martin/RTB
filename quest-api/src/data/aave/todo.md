Earn points for each supply tx:

```
query UserById {
  supplies(
    where: {user: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60", reserve_: {asset: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb"}}
  ) {
    onBehalfOf
    amount
    reserve {
      asset
    }
  }
}
```


Earn points for each borrows
```
query UserById {
  borrows(
    where: {user: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60", reserve_: {asset: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb"}}
  ) {
    onBehalfOf
    amount
    reserve {
      asset
    }
  }
}
```
