---
title: callback function
sidebar_position: 2
last_update:
  author: cm jeon
  date: 2023-03-01
description: Promise 에 대해 알아봅시다.
tags: ['javascript']
keywords: ['promise']
draft: true
---

## 이 글을 읽고 이해하게 되는 점

- javascript 가 동작하는 방식
- Promise 가 동작하는 방식
- ksnet 사건의 전말
- 

## ksnet 결제 오류 사고

KSNET 에 청구할인 상점코드로 결제가 진행되는 오류가 발생하였음

```javascript
// ... networking
$ajax.get()
.then(res => {
  const isBillingDiscount = this.checkCondition()
  if(isBillingDiscount) {
    console.log('청구할인 상점코드')
  }
})
 
async checkCondition() {
  return await Promise.all(await this.conA, await this.conB, await this.conB)
}

async conA() {
  
}

async conB() {
  
}

async conC() {
  
}
```

## Promise 을 한마디로 정의하면?

> Promise는 비동기 작업의 최종 완료 또는 실패를 나타내는 객체입니다.

비동기 작업의 처리를 위해 javascript 가 가지고 있는 표준 내장 객체입니다.

Promise 객체를 생성하고, resolve(), reject(), all(), race() 등 정적메소드를 사용할 수 있습니다. 

## 왜 javascript 에 Promise 가 필요한가?

브라우저에서 서버로부터 데이터를 조회한다고 생각해보겠습니다.




근데 javascript 에서 Promise 가 중요한 이유를

javascript 는 비동기처리가 필요한 부분이 있습니다.

왜냐하면 싱글쓰레드이기 때문에..

싱글쓰레드에 대한 설명..

싱글쓰레드이기 때문에 콜백이 필요하다.

콜백에 대한 설명..

다시 Promise 로 돌아와서 설명하면 Promise 는 상태와 값을 가집니다.

상태는 3종류 pending, fulfilled, rejected

값은 그때그때 다릅니다.



## 참고

https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise

https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Using_promises

https://joshua1988.github.io/web-development/javascript/promise-for-beginners/

https://poiemaweb.com/es6-promise

https://ko.javascript.info/promise-basics

https://www.sungikchoi.com/blog/call-stack-callback-queue-event-loop/