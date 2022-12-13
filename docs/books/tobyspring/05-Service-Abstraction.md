---
title: 5장 서비스 추상화
sidebar_position: 5
last_update:
  author: cm jeon
  date: 2023-01-10
description: DAO 에 트랜잭션을 적용해보면서 스프링이 어떻게 성격이 비슷한 여러 기술을 추상화하고, 일관된 방법으로 사용할 수 있도록 지원하는지 알아봅니다.
tags: ['Toby\'s Spring']
keywords: ['서비스 추상화']
draft: true
---

## 5.1 사용자 레벨 관리 기능 추가

UserDao 에 비즈니스 로직을 추가해 봅니다.

사용자 관리 기능에서 구현해야하는 비즈니스 로직은 다음과 같습니다.

- 사용자의 레벨은 BASIC, SILVER, GOLD 세 가지 중 하나다. 
- 사용자가 처음 가입하면 BASIC 레벨이 되며, 이후 활동에 따라서 한 단계씩 업그레이드될 수 있다. 
- 가입 후 50회 이상 로그인을 하면 BASIC 에서 SILVER 레벨이 된다. 
- SILVER 레벨이면서 30번 이상 추천을 받으면 GOLD 레벨이 된다. 
- 사용자 레벨의 변경 작업은 일정한 주기를 가지고 일괄적으로 진행된다. 변경 작업 전에는 조건을 충족하더라도 레벨의 변경이 일어나지 않는다.

<!--truncate-->

### 5.1.1 필드 추가

#### Level 이늄

User 테이블에 레벨을 저장할 필드가 필요합니다.

필드에는 문자보다는 레벨을 코드화해서 숫자로 넣는 것이 좋습니다.

반대로 코드에서는 숫자로 보는 것 보다는 이늄을 사용하는 것이 좋습니다.

코드에서 숫자로 레벨을 받으면 엉뚱한 값을 레벨로 넣는다거나 범위를 벗어나는 값을 넣을 우려가 있기 때문입니다.

```java title="Level.java"
public enum Level {
	BASIC(1), 
	SILVER(2), 
	GOLD(3);

	private final int value;
		
	Level(int value) {
		this.value = value;
	}

  // 오브젝트 -> 값
	public int intValue() {
		return value;
	}
	
	// 값 -> 오브젝트
	public static Level valueOf(int value) {
		switch(value) {
		case 1: return BASIC;
		case 2: return SILVER;
		case 3: return GOLD;
		default: throw new AssertionError("Unknown value: " + value);
		}
	}
}
```

이늄은 오브젝트를 가지고 있으면서, DB 에 저장할 코드숫자도 가지고 있습니다.

따라서 엉뚱한 값이나 범위를 벗어나는 값을 넣으면 컴파일 오류가 발생하게 됩니다.

#### User 필드 추가

User 클래스에도 Level 을 추가해 줍니다.

```java title="User.java"
public class User {
	
	// ...
	
	Level level; // 현재 레벨
	int login; // 로그인 횟수
	int recommend; // 추천 횟수
	
	public User(String id, String name, String password, Level level, int login, int recommend) {
		this.id = id;
		this.name = name;
		this.password = password;
		// highlight-start
		this.level = level;
		this.login = login;
		this.recommend = recommend;
		// highlight-end
	}

	// ...

	public Level getLevel() {
		return level;
	}

	public void setLevel(Level level) {
		this.level = level;
	}
	
	public int getLogin() {
		return login;
	}

	public void setLogin(int login) {
		this.login = login;
	}

	public int getRecommend() {
		return recommend;
	}

	public void setRecommend(int recommend) {
		this.recommend = recommend;
	}

}
```

#### UserDaoTest 테스트 수정

UserDaoTest.java 도 수정해줍니다.

```java title="UserDaoTest.java"
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations="/test-applicationContext.xml")
public class UserDaoTest {

	@Autowired UserDao dao; 
	@Autowired DataSource dataSource;
	
	private User user1;
	private User user2;
	private User user3; 
	
	@Before
	public void setUp() {
	  // highlight-start
		this.user1 = new User("gyumee", "박성철", "springno1", Level.BASIC, 1, 0);
		this.user2 = new User("leegw700", "이길원", "springno2", Level.SILVER, 55, 10);
		this.user3 = new User("bumjin", "박범진", "springno3", Level.GOLD, 100, 40);
		// highlight-end
	}
	
	// ...
	
	private void checkSameUser(User user1, User user2) {
		assertThat(user1.getId(), is(user2.getId()));
		assertThat(user1.getName(), is(user2.getName()));
		assertThat(user1.getPassword(), is(user2.getPassword()));
		// highlight-start
		assertThat(user1.getLevel(), is(user2.getLevel()));
		assertThat(user1.getLogin(), is(user2.getLogin()));
		assertThat(user1.getRecommend(), is(user2.getRecommend()));
		// highlight-end
	}
	
}
```

#### UserDaoJdbc 수정

UserDaoJdbc.java 도 수정합니다.

```java title="UserDaoJdbc.java
private RowMapper<User> userMapper = new RowMapper<User>() {
  public User mapRow(ResultSet rs, int rowNum) throws SQLException {
    User user = new User();
    user.setId(rs.getString("id"));
    user.setName(rs.getString("name"));
    user.setPassword(rs.getString("password"));
    // highlight-start
    user.setLevel(Level.valueOf(rs.getInt("level")));
    user.setLogin(rs.getInt("login"));
    user.setRecommend(rs.getInt("recommend"));
    // highlight-end
    return user;
  }
};

public void add(User user) {
  this.jdbcTemplate.update("insert into users(id, name, password, level, login, recommend) values(?, ?, ?, ?, ?, ?)", 
      user.getId(), 
      user.getName(), 
      user.getPassword(),
      // highlight-start 
      user.getLevel().intValue(), 
      user.getLogin(), 
      user.getRecommend()
      // highlight-end
  );
}
```

JDBC 가 사용하는 SQL 은 컴파일 과정에서는 자동으로 검증되지 않는 문자열입니다.

그래서 SQL 문장이 실행되기 전까지는 문법 오류나 오타를 발견하기 어렵습니다.

### 5.1.2 사용자 수정 기능 추가

수정할 정보가 담긴 User 객체를 전달하면 id 를 참고해서 사용자를 찾아서 정보를 갱신하는 메소드를 만들어 봅니다.

#### 수정 기능 테스트 추가

update 테스트를 추가합니다.

```java title="UserDaoTest.java"
@Test
public void update() {
  dao.deleteAll();
  
  dao.add(user1);
  
  user1.setName("오민규");
  user1.setPassword("springno6");
  user1.setEmail("user6@ksug.org");
  user1.setLevel(Level.GOLD);
  user1.setLogin(1000);
  user1.setRecommend(999);
  
  dao.update(user1);
  
  User user1update = dao.get(user1.getId());
  checkSameUser(user1, user1update);
}
```

#### UserDao 와 UserDaoJdbc 수정

UserDao 에 update() 메소드를 추가합니다.

UserDao 를 구현한 UserDaoJdbc 에도 update() 메소드가 필요합니다.

```java title="UserDaoJdbc.java"
public void update(User user) {
  this.jdbcTemplate.update(
      "update users set name = ?, password = ?, email = ?, level = ?, login = ?, recommend = ? where id = ? ", 
      user.getName(), 
      user.getPassword(), 
      user.getEmail(), 
      user.getLevel().intValue(), 
      user.getLogin(), 
      user.getRecommend(),
      user.getId()
  );
}
```

#### 수정 테스트 보완

테스트 코드를 보완하여 UPDATE 문의 실수를 발견할 수 있도록 해봅니다.

```java title="UserDaoTest.java"
@Test
public void update() {
  dao.deleteAll();
  
  dao.add(user1);		// 수정할 사용자
  dao.add(user2);		// 수정하지 않을 사용자
  
  user1.setName("오민규");
  user1.setPassword("springno6");
  user1.setEmail("user6@ksug.org");
  user1.setLevel(Level.GOLD);
  user1.setLogin(1000);
  user1.setRecommend(999);
  
  dao.update(user1);
  
  User user1update = dao.get(user1.getId());
  checkSameUser(user1, user1update);
  User user2same = dao.get(user2.getId());
  checkSameUser(user2, user2same);
}
```

### 5.1.3 UserService.upgradeLevels()

비즈니스 로직을 Dao 에 두는 것은 적당하지 않습니다.

Dao 는 데이터를 다루는 영역이기 때문입니다.

대신에 사용자 관리 로직을 추가할 UserService 를 생성합니다.

#### UserService 클래스와 빈 등록

```java title="UserService.java"
public class UserService {
  
	private UserDao userDao;

	public void setUserDao(UserDao userDao) {
		this.userDao = userDao;
	}

}
```

그리고 UserService 를 빈으로 등록하기 위해 XML 에 추가해줍니다.

#### UserServiceTest 테스트 클래스

```java title="UserServiceTest.java"
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations="/test-applicationContext.xml")
public class UserServiceTest {

	@Autowired UserService userService;	
	
	@Test
  public void bean() {
    assertThat(this.userService, is(notNullValue()));
  }
  
}
```

#### upgradeLevels() 메소드

UserService 에 upgradeLevels() 메소드를 추가합니다.

```java title="UserService.java"
public class UserService {
  
	// ...
	
	List<User> users = userDao.getAll();  
		for(User user : users) {  
			Boolean changed = null;
			if (user.getLevel() == Level.BASIC && user.getLogin() >= 50) {
        user.setLevel(Level .SILVER);
        changed = true;
      }
      else if (user.getLevel() == Level.SILVER && user.getRecommend() >= 30) {
        user.setLevel(Level .GOLD);
        changed = true;
      }
      else if (user.getLevel() == Level.GOLD) { changed = false; } 
      else { changed = false; }
      if (changed) { userDao.update(user); }
	  }
  }
}
```

#### upgradeLevels() 테스트

테스트 픽스처를 등록합니다.

```java title="UserServiceTest.java
@Before
public void setUp() {
  users = Arrays.asList(
      new User("bumjin", "박범진", "p1", Level.BASIC, 49, 0),
      new User("joytouch", "강명성", "p2", Level.BASIC, 50, 0),
      new User("erwins", "신승한", "p3", Level.SILVER, 60,29),
      new User("madnite1", "이상호", "p4", Level.SILVER, 60, 30),
      new User("green", "오민규", "p5", Level.GOLD, 100, 100)
  );
}
```

테스트를 할 때는 데이터의 경계가 되는 값의 전후로 테스트 하는 것이 좋습니다.

```java title="UserServiceTest.java"
@Test
public void upgradeLevels() {
  userDao.deleteAll();
  for(User user : users) userDao.add(user);
  
  // highlight-next-line
  userService.upgradeLevels();
  
  checkLevel(users.get(0), Level.BASIC);
  checkLevel(users.get(1), Level.SILVER);
  checkLevel(users.get(2), Level.SILVER);
  checkLevel(users.get(3), Level.GOLD);
  checkLevel(users.get(4), Level.GOLD);
}

private void checkLevel(User user, boolean expectedLevel) {
  User userUpdate = userDao.get(user.getId());
  assertThat(userUpdate.getLevel(), is(expectedLevel));
}
```

사용자 정보를 저장한 후 upgradeLevels() 메소드를 실행합니다.

그리고 checkLevel() 메소드로 기대하는 레벨로 변경되었는지 확인합니다.

### 5.1.4 UserService.add()

사용자가 등록될 때 BASIC 레벨이 되는 비즈니스 로직을 추가하기 위해 테스트케이스를 추가합니다.

레벨이 없는 사용자는 BASIC 레벨을 부여하고, 이미 레벨이 있는 사용자는 원래 레벨을 유지해야 합니다.

```java title="UserServiceTest.java
@Test 
public void add() {
  userDao.deleteAll();
  
  User userWithLevel = users.get(4);	  // GOLD 레벨  
  User userWithoutLevel = users.get(0);  
  userWithoutLevel.setLevel(null);
  
  userService.add(userWithLevel);	  
  userService.add(userWithoutLevel);
  
  User userWithLevelRead = userDao.get(userWithLevel.getId());
  User userWithoutLevelRead = userDao.get(userWithoutLevel.getId());
  
  assertThat(userWithLevelRead.getLevel(), is(userWithLevel.getLevel())); 
  assertThat(userWithoutLevelRead.getLevel(), is(Level.BASIC));
}
```

UserService 에 add() 메소드를 추가합니다.

```java title="UserService.java"
public void add(User user) {
  if (user.getLeveK) == null) user.setLevel(Level.BASIC);
  userDao.add(user);
}
```

### 5.1.5 코드 개선

#### upgradeLevels() 메소드 코드의 문제점

#### upgradeLevels() 리팩토링

#### User 테스트

#### UserServiceTest 개선

## 5.2 트랜잭션 서비스 추상화

### 5.2.1 모 아니면 도

#### 테스트용 UserService 대역

#### 강제 예외 발생을 통한 테스트

#### 테스트 실패의 원인

### 5.2.2 트랜잭션 경계설정

#### JDBC 트랜잭션의 트랜잭션 경계설정

#### UserService 와 UserDao의 트랜잭션 문제

#### 비즈니스 로직 내의 트랜잭션 경계설정

#### UserService 트랜잭션 경계설정의 문제점

### 5.2.3 트랜잭션 동기화

#### Connection 파라미터 제거

#### 트랜잭션 동기화 적용

#### 트랜잭션 테스트 보완

#### JdbcTemplate 과 트랜잭션 동기화

### 5.2.4 트랜잭션 서비스 추상화

#### 기술과 환경에 종속되는 트랜잭션 경계설정 코드

#### 트랜잭션 API의 의존관계 문제와 해결책

#### 스프링의 트랜잭션 서비스 추상화

#### 트랜잭션 기술 설정의 분리

## 5.3 서비스 추상화와 단일 책임 원칙

### 수직, 수평 계층구조와 의존관계

### 단일 책임 원칙

### 단일 책임 원칙의 장점

## 5.4 메일 서비스 추상화

### 5.4.1 JavaMail을 이용한 메일 발송 기능

#### JavaMail 메일 발송

### 5.4.2 JavaMail이 포함된 코드의 테스트

### 5.4.3 테스트를 위한 서비스 추상화

#### JavaMail을 이용한 테스트의 문제점

#### 메일 발송 기능 추상화

#### 테스트용 메일 발송 오브젝트

#### 테스트와 서비스 추상화

### 5.4.4 테스트 대역

#### 의존 오브젝트의 변경을 통한 테스트 방법

#### 테스트 대역의 종류와 특징

#### Mock 오브젝트를 이용한 테스트