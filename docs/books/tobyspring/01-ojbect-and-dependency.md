---
title: 1장 오브젝트와 의존관계
sidebar_position: 1
last_update:
  author: cm jeon
  date: 2023-01-10
description: ""
tags: ["Toby's Spring"]
keywords: ['오브젝트','의존관계']
draft: true
---

스프링이 지원하는 세가지 핵심 프로그래밍 모델이다.

1. IoC/DI 라고 불리는 오브젝트의 생명주기와 의존관계에 대한 프로그래밍 모델
2. 서비스의 추상화
3. AOP 라는 애플리케이션 코드에 산재해서 나타나는 부가적인 기능을 독립적으로 모듈화하는 프로그래밍 모델

스프링을 사용한다는 것은 이 세가지 요소를 적극적으로 활용한다는 것

## 1.1 초난감 DAO

스프링은 오브젝트에 관심을 둔다.

오브젝트에 대한 관심은 오브젝트 설계 방법인 디자인 패턴, 구조를 개선하는 리팩토링, 검증하는데 쓰이는 테스트를 발전시켰다.

여기 User 클래스가 있다.

<!--truncate-->

```java title="User.java"
public class User {
  String id;
  String name;
  String password;

  public String getId {
    return id;
  }
  public void setId(String id) {
    this.id = id;
  }
  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  )
  public String getPassword() {
    return password;
  }
  public void setPassword(String password) {
    this.password = password;
  }
}
```

UserDao 는 User 객체를 DB 에 저장하고 불러올 수 있는 클래스이다.

DB 를 사용하기 위해서는 JDBC 를 이용해야 된다.

이를 위해 UserDao 를 구현해본다.

```java title="UserDao.java"
public class UserDao {

  public void add(User user) throws ClassNotFoundException, SQLException {

    // DB 연결을 위한 커넥션을 가져온다.
    Class.forName("com.mysql.jdbc.Driver");
    Connection c = DriverManager.getConnection("jdbc:mysql://localhost/springbook?characterEncoding=UTF-8", "spring", "book");

    // SQL 을 담은 statement 를 만든다.
    PreparedStatement ps = c.prepareStatement("insert into users(id, name, password) values(?,?,?)");
    ps.setString(1, user.getId());
    ps.setString(2, user.getName());
    ps.setString(3, user.getPassword());

    // 작업한다.(데이터를 DB 에 추가한다.)
    ps.executeUpdate();

    // statement 와 connection 을 반환한다.
    ps.close();
    c.close();
  }

  public User get(String id) throws ClassNotFoundException, SQLException {

    // DB 연결을 위한 커넥션을 가져온다.
    Class.forName("com.mysql.jdbc.Driver");
    Connection c = DriverManager.getConnection("jdbc:mysql://localhost/springbook?characterEncoding=UTF-8", "spring", "book");

    // SQL 을 담은 statement 를 만든다.
    PreparedStatement ps = c.prepareStatement("select * from users where id = ?");
    ps.setString(1, id);

    // 작업한다.
    // 데이터를 DB 에서 가져온다.
    ResultSet rs = ps.executeQuery();
    rs.next();

     // 가져온 데이터를 User객체에 담는다.
    User user = new User();
    user.setId(rs.getString("id"));
    user.setName(rs.getString("name"));
    user.setPassword(rs.getString("password"));

    // statement 와 connection 을 반환한다.
    rs.close();
    ps.close();
    c.close();

    return user;

  }

}
```

이제 UserDao 에 main() 메소드를 만들어서 UserDao 를 테스트해본다.

```java title="UserDao.java"
public class UserDao {

  // ...

  public static void main(String[] args) throws ClassNotFoundException, SQLException {
    UserDao dao = new UserDao();

    User user = new User();
    user.setId("whiteship");
    user.setName("백기선");
    user.setPassword("married");

    dao.add(user);

    System.out.println(user.getId() + " 등록 성공");

    User user2 = dao.get(user.getId());
    System.out.println(user2.getName());
    System.out.println(user2.getPassword());

    System.out.println(user2.getId() + " 조회 성공");
  }

}
```

테스트를 실행해보면 잘 작동하는 것을 확인할 수 있다.

위의 UserDao 는 기능과 테스트는 돌아가지만 안타깝게도 객체지향적으로 만들어진 코드는 아니다.

이제부터 이 UserDao 를 고쳐가면서 객체지향 기술의 원리에 충실한 코드를 만들어 보겠다.
