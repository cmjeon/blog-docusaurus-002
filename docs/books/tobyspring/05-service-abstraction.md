---
title: 5장 서비스 추상화
sidebar_position: 5
last_update:
  author: cm jeon
  date: 2023-01-10
description: "DAO 에 트랜잭션을 적용해보면서 스프링이 어떻게 성격이 비슷한 여러 기술을 추상화하고, 일관된 방법으로 사용할 수 있도록 지원하는지 알아봅니다."
tags: ["Toby's Spring"]
keywords: ['서비스 추상화']
draft: true
---

import Image from '@theme/IdealImage';

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
	
	public void upgradeLevels() {
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

처음 가입하는 사용자는 기본적으로 BASIC 레벨이어야 합니다.

이 비즈니스 로직은 사용자 관리에 대한 비즈니스 로직을 담고 있는 UserService 에 이 로직을 담는 것이 좋습니다.

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
  
  // highlight-start
  assertThat(userWithLevelRead.getLevel(), is(userWithLevel.getLevel())); 
  assertThat(userWithoutLevelRead.getLevel(), is(Level.BASIC));
  // highlight-end
}
```

테스트케이스는 2가지를 테스트합니다.

level 이 비어있는 경우는 BASIC 을 부여해주고, 이미 설정된 level 이 있다면 그대로 두는 것입니다. 

이제 UserService 에 add() 메소드를 추가합니다.

```java title="UserService.java"
public void add(User user) {
  if (user.getLevel() == null) user.setLevel(Level.BASIC);
  userDao.add(user);
}
```

### 5.1.5 코드 개선

작성된 코드를 살펴볼 때는 다음과 같은 질문을 해볼 필요가 있습니다.

- 코드에 중복된 부분은 없는가?
- 코드가 무엇을 하는 것인지 이해하기 불편하지 않은가?
- 코드가 자신이 있어야 할 자리에 있는가?
- 앞으로 변경이 일어난다면 어떤 것이 있을 수 있고, 그 변화에 쉽게 대응할 수 있게 작성되어 있는가?

#### upgradeLevels() 메소드 코드의 문제점

upgrageLevels() 메소드를 다시 살펴봅니다.

```java title="UserService.java"
public class UserService {
  
	// ...
	
	public void upgradeLevels() {
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

updateLevels() 메소드에는 아래와 같은 문제점이 있습니다.

- 새로운 레벨이 추가되면 Level 이늄이 수정되어야 하고, upgradeLevels() 의 if 조건식이 추가되어야 한다.
- 업그레이드 조건이 복잡해질수록 메소드가 길어진다.
- 조건이 기존 레벨을 확인하고 각 레벨별로 조건을 판단하는 식으로 코드가 복잡해 질 수 있다.

#### upgradeLevels() 리팩토링

기존의 upgradeLevels() 메소드는 자주 변경될 가능성이 있는 구체적인 내용이 추상적인 로직의 흐름과 함께 섞여 있습니다.

:::info
비즈니스 로직을 추상적인 것과 구체적인 것으로 나눌 수 있는 기준은 구현의 변경가능성입니다.
:::

upgradeLevels() 메소드를 리팩토링하기 위해서 레벨을 업그레이드하는 기본 흐름만을 만들어 봅니다.

```java title="UserService.java"
public void upgradeLevels() {
  List<User> users = userDao.getAll(); 
  // highlight-start
  for(User user : users) {
    if (canUpgradeLevel(user)) { 
      upgradeLevel(user);
    }
  }
  // highlight-end
}
```

추상적인 기본 흐름은 `사용자 정보를 가져와 한 명씩 순회하면서 업그레이드 가능여부를 확인하고, 가능하면 업그레이드 한다.` 입니다.

구체적인 내용은 각 메소드에서 구현합니다.

canUpgradeLevel() 메소드를 구현해봅니다.

여기서는 레벨별로 업그레이드 조건을 확인합니다.

```java title="UserService.java"
private boolean canUpgradeLevel(User user) {
  Level currentLevel = user.getLevel();
  switch(currentLevel) {
    case BASIC: return (user.getLogin() >= 50); 
    case SILVER: return (user.getRecommend() >= 30);
    case GOLD: return false;
    default: throw new IllegalArgumentException("Unknown Level: " + currentLevel); 
  }
}
```

업그레이드 조건이 확인되면 updateLevel() 메소드로 업그레이드 작업을 진행합니다.

```java title="UserService.java"
private void upgradeLevel(User user) {
  if (user.getLevel() == level.BASIC) user.setLevel(Level.SILVER);
  else if (user.getLevel() == level.SILBER) user.setLevel(Level.GOLD);
  userDao.update(user);
}
```

upgradeLevel() 메소드는 레벨간의 관계가 노골적으로 드러난다는 것, 레벨이 늘어나면 if 문이 점점 길어지나는 것, 예외상황에 대한 처리가 없다는 문제가 있습니다.

레벨간의 관계는 Level 이늄으로 이동시킵니다.

```java Level.java
public enum Level {

  // highlight-start
	GOLD(3, null), 
	SILVER(2, GOLD), 
	BASIC(1, SILVER); 
	// highlight-end 
	
	private final int value;
	// highlight-next-line
	private final Level next; 
	
	Level(int value, Level next) {  
		this.value = value;
		this.next = next; 
	}
	
  // ...
	
	public Level nextLevel() { 
		return this.next;
	}
	
	// ...
	
}
```

이렇게 하면 비즈니스 로직에서 조건식으로 다음 레벨을 지정할 필요가 없습니다.

사용자의 레벨이 바뀌는 부분도 UserService 보다 User 에서 처리하도록 합니다.

:::info
객체의 내부 정보가 변경되는 것은 객체 스스로 다루는 것이 적절합니다.
:::

```java title="User.java"
public void upgradeLevel() {
  Level nextLevel = this.level.nextLevel();	
  if (nextLevel == null) { 								
    throw new IllegalStateException(this.level + "은  업그레이드가 불가능합니다");
  }
  else {
    this.level = nextLevel;
  }	
}
```

upgradeLevel() 메소드를 잘못 사용하는 코드가 있을 수 있으니 예외처리도 포함하도록 합니다.

리팩토링 후 UserService 는 다음과 같이 변경됩니다.

```java title="UserService.java"
public void upgradeLevels() {
  List<User> users = userDao.getAll(); 
  for(User user : users) {
    if (canUpgradeLevel(user)) { 
      upgradeLevel(user);
    }
  }
}

private boolean canUpgradeLevel(User user) {
  Level currentLevel = user.getLevel();
  switch(currentLevel) {
    case BASIC: return (user.getLogin() >= 50); 
    case SILVER: return (user.getRecommend() >= 30);
    case GOLD: return false;
    default: throw new IllegalArgumentException("Unknown Level: " + currentLevel); 
  }
}

private void upgradeLevel(User user) {
  user.upgradeLevel();
  userDao.update(user);
}
```

UserService, User, Level 이 각자의 내부 정보를 다루는 자신의 책임에 충실한 기능을 가지고 있으면서 필요한 일이 생기면 수행을 요청하는 구조를 가지고 있습니다.

코드 간결하기 때문에 변경이 필요할 때 수정할 지점을 쉽게 찾을 수 있습니다.

독립적으로 테스트하도록 만든다면 테스트 코드도 단순해 집니다.

:::info
객체지향적 코드는 다른 객체의 데이터를 가져와서 작업하지 않고 그 객체에 작업을 해달라고 요청합니다.
:::

#### User 테스트

User 에 대한 테스트도 만들어 봅니다.

```java title="UserTest.java
public class UserTest {
	User user;
	
	@Before
	public void setUp() {
		user = new User();
	}
	
	@Test()
	public void upgradeLevel() {
		Level[] levels = Level.values();
		for(Level level : levels) {
			if (level.nextLevel() == null) continue;
			user.setLevel(level);
			user.upgradeLevel();
			assertThat(user.getLevel(), is(level.nextLevel()));
		}
	}
	
	@Test(expected=IllegalStateException.class)
	public void cannotUpgradeLevel() {
		Level[] levels = Level.values();
		for(Level level : levels) {
			if (level.nextLevel() != null) continue;
			user.setLevel(level);
			user.upgradeLevel();
		}
	}

}
```

#### UserServiceTest 개선

```java title="UserServiceTest.java"
@Test
public void upgradeLevels() {
  userDao.deleteAll();
  for(User user : users) userDao.add(user);
  
  userService.upgradeLevels();
  
  checkLevelUpgraded(users.get(0), false);
  checkLevelUpgraded(users.get(1), true);
  checkLevelUpgraded(users.get(2), false);
  checkLevelUpgraded(users.get(3), true);
  checkLevelUpgraded(users.get(4), false);
}

private void checkLevelUpgraded(User user, boolean upgraded) {
  User userUpdate = userDao.get(user.getId());
  if (upgraded) {
    assertThat(userUpdate.getLevel(), is(user.getLevel().nextLevel()));
  } else {
    assertThat(userUpdate.getLevel(), is(user.getLevel()));
  }
}
```

기존 테스트 코드에서 무엇을 테스트하는지 잘 보이지 않았던 문제가 있었습니다.

checkLevel() 메소드 호출 시 파라미터로 전달하는 Level 이늄은 어떻게 테스트하는 것인지 알 수가 없습니다.

반면에 checkLevelUpgraded() 메소드의 true/false 는 레벨 업그레이드 여부를 확인하려는 의도가 드러납니다.

고정된 값도 상수로 변경해 줍니다.

숫자의 의미를 파악하기 쉽게 하기 위해서이고, 또한 여러곳의 값을 한번에 수정할 수도 있습니다.

```json title="UserService.java"
public class UserService {
  // highlight-start
	public static final int MIN_LOGCOUNT_FOR_SILVER = 50;
	public static final int MIN_RECCOMEND_FOR_GOLD = 30;
	// highlight-end

  // ...

	private boolean canUpgradeLevel(User user) {
		Level currentLevel = user.getLevel(); 
		switch(currentLevel) {
		  // highlight-start                                   
      case BASIC: return (user.getLogin() >= MIN_LOGCOUNT_FOR_SILVER); 
      case SILVER: return (user.getRecommend() >= MIN_RECCOMEND_FOR_GOLD);
      // highlight-end
      case GOLD: return false;
      default: throw new IllegalArgumentException("Unknown Level: " + currentLevel); 
		}
	}

	// ...

}
```

UserServiceTest 도 변경합니다.

```java title="UserServiceTest.java"
// ...

import static springbook.user.service.UserService.MIN_LOGCOUNT_FOR_SILVER;
import static springbook.user.service.UserService.MIN_RECCOMEND_FOR_GOLD;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations="/test-applicationContext.xml")
public class UserServiceTest {
  
  // ...
	
	@Before
	public void setUp() {
		users = Arrays.asList(
      new User("bumjin", "박범진", "p1", Level.BASIC, MIN_LOGCOUNT_FOR_SILVER-1, 0),
      new User("joytouch", "강명성", "p2", Level.BASIC, MIN_LOGCOUNT_FOR_SILVER, 0),
      new User("erwins", "신승한", "p3", Level.SILVER, 60, MIN_RECCOMEND_FOR_GOLD-1),
      new User("madnite1", "이상호", "p4", Level.SILVER, 60, MIN_RECCOMEND_FOR_GOLD),
      new User("green", "오민규", "p5", Level.GOLD, 100, Integer.MAX_VALUE)
    );
	}

	// ...
	
}
```

마지막으로 레벨을 업그레이드 하는 정책을 UserService 에서 분리하는 방법을 고려할 수도 있습니다.

UserLevelUpgradePolicy 인터페이스를 만들고 UserService 에 주입하도록 만드는 방법입니다.

## 5.2 트랜잭션 서비스 추상화

사용자 레벨 조정 작업 중간에 문제가 발생하면 그때까지 진행되었던 모든 변경 작업을 모두 취소시키도록 합니다.

### 5.2.1 모 아니면 도

작업 수행 중 예외가 던져지는 상황을 의도적으로 만들어서 테스트해 봅니다.

#### 테스트용 UserService 대역

UserService 의 서브클래스를 테스트용으로 만듭니다.

테스트용 UserService 서브클래스는 UserService 의 일부를 특정 시점에 강제로 예외를 발생하도록 합니다.

테스트용이기 때문에 테스트클래스 내부에서 static 클래스로 만듭니다.

테스트하려는 UserService 의 upgradeLevel() 메소드의 접근권한을 `protected` 로 변경하고, 서브클래스에서 오버라이딩 합니다.

```java title="UserServiceTest.java"
static class TestUserService extends UserService {
  private String id;
  
  private TestUserService(String id) {  
    this.id = id;
  }

  // highlight-next-line
  protected void upgradeLevel(User user) {
    if (user.getId().equals(this.id)) throw new TestUserServiceException();  
    super.upgradeLevel(user);  
  }
}

static class TestUserServiceException extends RuntimeException {
}
```

#### 강제 예외 발생을 통한 테스트

UserServiceTest 에 테스트케이스를 만듭니다.

```java title="UserServiceTest.java"
import static org.junit.Assert.fail;

// ...

public class UserServiceTest {

  // ...
  
  @Test
  public void upgradeAllOrNothing() throws Exception {
    UserService testUserService = new TestUserService(users.get(3).getId());  
    testUserService.setUserDao(this.userDao); 
    testUserService.setDataSource(this.dataSource);
     
    userDao.deleteAll();			  
    for(User user : users) userDao.add(user);
    
    try {
      testUserService.upgradeLevels();   
      fail("TestUserServiceException expected"); 
    } catch(TestUserServiceException e) { 
    }
    
    // 기존 User 의 등급이 변경되었는지 확인
    checkLevelUpgraded(users.get(1), false);
  }
}
```

하지만 이 테스트는 실패합니다.

#### 테스트 실패의 원인

upgradeLevels() 메소드가 아직 트랜잭션으로 처리되지 않기 때문입니다.

### 5.2.2 트랜잭션 경계설정

하나의 SQL 명령은 DB 자체에서 트랜잭션을 보장합니다.

하지만 이번 요구사항처럼 여러 SQL 명령을 하나의 트랜잭션으로 묶어야 하는 상황이 있습니다.

#### JDBC 트랜잭션의 트랜잭션 경계설정

트랜잭션은 시작하는 지점과 끝나는 지점이 있습니다.

시작하는 방법은 한가지이지만 끝내는 방법은 무효화인 Transaction Rollback, 확정하는 Transaction Commit 이 있습니다.

트랜잭션이 시작하고 끝나는 지점을 트랜잭션 경계라고 합니다.

트랜잭션의 시작과 종료는 Connection 오브젝트를 통해 이루어 집니다.

JDBC 의 기본설정은 DB 작업 수행이 완료되면 트랜잭션 커밋을 하도록 되어 있습니다.

setAutoCommit(false) 으로 시작하고, commit(), rollback() 을 선언하여 수동으로 처리하는 작업을 트랜잭션의 경계설정 transaction demarcation 이라고 합니다.

#### UserService 와 UserDao의 트랜잭션 문제

일반적으로 트랜잭션은 Connection 보다 수명이 짧습니다.

UserDaoJdbc 는 JdbcTemplate 을 사용하고, JdbcTemplate 메소드(ex. update())들은 DataSource 의 getConnection() 메소드를 호출하여 작업하고, 작업이 끝나면 Connection 을 닫아줍니다.

결국 JdbcTemplate 메소드 호출 한번에 하나의 Connection 을 만들고 닫기 때문에, 각 메소드들은 독립적인 트랜잭션으로 실행될 수 밖에 없습니다.

#### 비즈니스 로직 내의 트랜잭션 경계설정

여러 SQL 을 한번에 묶기 위해서는 UserService 에서 트랜잭션의 경계설정 작업을 해야합니다.

UserService 에서 Connection 객체를 생성하고, Connection 객체를 upgradeLevel() 메소드나 UserDaoJdbc 객체의 메소드를 통해 전달해줘야 합니다. 

#### UserService 트랜잭션 경계설정의 문제점

UserService 와 UserDao 에 Connection 객체를 생성하고, 전달받아 처리하는 식의 수정은 다른 문제를 발생시킵니다.

1. JdbcTemplate 사용이 불가
2. UserService 와 UserDao 에 Connection 객체가 계속 전달
3. UserDao 의 데이터 액서스 방식이 바뀌면 UserService 도 변경
4. 테스트코드의 변경

### 5.2.3 트랜잭션 동기화

#### Connection 파라미터 제거

upgradeLevels() 메소드가 트랜잭션 경계설정을 해야하는 상황에서 Connection 을 파라미터로 전달하는 문제를 해결해봅니다.

스프링에서는 트랜잭션 동기화 transaction synchronization 방식을 제안합니다.

UserService 에서 만든 Connection 객체를 특별한(?) 저장소에 보관해두고 필요할 때 사용하는 방식입니다.

트랜잭션 동기화를 사용한 경우의 작업 흐름을 살펴봅니다.

<Image img={require('./05-3.png')} />

1. UserService 가 Connection 을 생성한다.
2. 트랜잭션 동기화 저장소에 저장하고, Connection 의 setAutoCommit(false) 를 호출해 트랜잭션을 시작한다.
3. 첫 번째 update() 메소드가 호출되면 update() 메소드 내부에서 JdbcTemplate 의 update() 메소드가 작동된다.
4. JdbcTemplate 의 update() 메소드는 트랜잭션 동기화 저장소에 현재 시작된 트랜잭션을 가진 Connection 객체가 있는지 확인한다.
5. Connection 객체를 이용해서 PreparedStatement 를 만들어 SQL 을 실행한다. JdbcTemplate 는 Connection 객체를 트랜잭션 동기화 저장소에서 가져온 경우에는 Connection 을 닫지 않고 작업을 마친다.
6. 두 번째 update() 메소드가 호출된다.
7. 트랜잭션 동기화 저장소에 Connection 을 가져온다.
8. JdbcTemplate 는 Connection 객체를 사용해서 SQL 을 실행한다.
9. 마지막 update() 메소드가 호출된다.
10. 트랜잭션 동기화 저장소에 Connection 을 가져온다.
11. JdbcTemplate 는 Connection 객체를 사용해서 SQL 을 실행한다.
12. UserService 는 트랜잭션 내의 모든 작업이 끝나면 Connection 의 commit() 을 호출해서 트랜잭션을 완료시킨다.
13. UserService 는 트랜잭션이 완료되면 트랜잭션 저장소에서 Connection() 객체를 삭제한다.

트랜잭션 동기화 저장소는 작업 스레드마다 독립적으로 Connection 객체를 저장하고 관리하기 때문에 멀티스레드 환경에서도 충돌이 날 염려는 없습니다.

트랜잭션 동기화 기법을 사용하면 파라미터를 통해 일일이 Connection 객체를 전달할 필요가 없습니다.

#### 트랜잭션 동기화 적용

스프링에서는 트랜잭션 동기화 기능을 지원하는 유틸리티 메소드를 제공합니다.

```java title="UserService.java"
// ...

import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class UserService {
  private DataSource dataSource;
  
	public void setDataSource(DataSource dataSource) {
		this.dataSource = dataSource;
	}
	
	public void upgradeLevels() throws Exception {
	  // highlight-start
		TransactionSynchronizationManager.initSynchronization();  
		Connection c = DataSourceUtils.getConnection(dataSource); 
		c.setAutoCommit(false);
		// highlight-end
		
		try {									   
			List<User> users = userDao.getAll();
			for (User user : users) {
				if (canUpgradeLevel(user)) {
					upgradeLevel(user);
				}
			}
			c.commit();
		// highlight-start  
		} catch (Exception e) {    
			c.rollback();
			throw e;
    // highlight-end
		} finally {
			DataSourceUtils.releaseConnection(c, dataSource);
			// highlight-start	
			TransactionSynchronizationManager.unbindResource(this.dataSource);  
			TransactionSynchronizationManager.clearSynchronization();
			// highlight-end  
		}
	}
	
	// ...
	
}
```

스프링이 제공하는 트랜잭션 동기화 관리 클래스는 TransactionSynchronizationManager 입니다.

DataSourceUtils 의 getConnection() 메소드를 사용하는 이유는 Connection 객체를 생성해주기도 하지만 트랜잭션 동기화에 사용하도록 저장소에 바인딩해주기 때문입니다.

#### 트랜잭션 테스트 보완

UserServiceTest 의 upgradeAllOrNothing() 테스트 메소드에 dataSource 빈을 주입해줍니다.

```java title="UserServiceTest.java"

// ...

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations="/test-applicationContext.xml")
public class UserServiceTest {
  // highlight-next-line
	@Autowired DataSource dataSource;

  @Test
  public void upgradeAllOrNothing() throws Exception {
    UserService testUserService = new TestUserService(users.get(3).getId());  
    testUserService.setUserDao(this.userDao); 
    // highlight-next-line
    testUserService.setDataSource(this.dataSource);
     
    userDao.deleteAll();			  
    for(User user : users) userDao.add(user);
    
    try {
      testUserService.upgradeLevels();   
      fail("TestUserServiceException expected"); 
    } catch(TestUserServiceException e) { 
    }
    
    checkLevelUpgraded(users.get(1), false);
  }
  
}
```

레벨 업그레이드 작업에 트랜잭션이 적용됩니다.

사용자의 레벨 업그레이드 작업을 완료하지 못하면 이미 변경된 사용자의 레벨도 롤백됩니다.

#### JdbcTemplate 과 트랜잭션 동기화

트랜잭션 동기화 저장소에 등록된 Connection 객체가 없는 경우에 JdbcTemplate 는 직접 DB 커넥션을 만들고 트랜잭션을 시작해서 JDBC 작업을 진행합니다.

반면 upgradeLevels() 메소드처럼 트랜잭션 동기화를 시작해놓았다면 트랜잭션 동기화 저장소에 들어 있는 DB 커넥션을 가져와서 기존의 트랙잭션에 참여합니다.

### 5.2.4 트랜잭션 서비스 추상화

#### 기술과 환경에 종속되는 트랜잭션 경계설정 코드

여러 개의 DB 를 사용하고 있는 환경에서는 JDBC Connection 을 이용한 트랜잭션 방식인 로컬 트랜잭션으로는 불가능합니다.

로컬 트랜잭션은 하나의 DB Connection 에 종속되기 때문입니다.

별도의 트랜잭션 관리자를 통해 트랜잭션을 관리하는 글로벌 트랜잭션 Global Transaction 방식을 사용해야 합니다.

자바는 글로벌 트랜잭션을 지원하는 트랜잭션 매니저를 지원하기 위한 API 인 JTA Java Transaction API 를 제공하고 있습니다.

아래는 JTA 를 이용한 트랜잭션 처리 코드의 전형적인 구조입니다.

```java
InitialContext ctx = new InitialContext();
UserTransaction tx = (UserTransaction) ctx.lookup(USER_TX_JNDI_NAME);
tx.begin();
Connection c = dataSource.getConnection();
try {
  tx.commit();
} catch (Exception e) {
  tx.rollback();
  throw.e;
} finally {
  c.close();
}
```

JDBC 로컬 트랜잭션을 JTA 를 이용하는 글로벌 트랜잭션으로 변경하려면 UserService 의 코드를 수정해야 합니다.

UserService 의 입장에서는 자신의 로직말고 기술환경이 바뀌었는데 코드가 변경이 되어 버립니다.

#### 트랜잭션 API의 의존관계 문제와 해결책

원래 UserService 는 UserDao 인터페이스에만 의존하고 있었기 때문에 구현 클래스의 변경에 영향을 받지 않았습니다.

DB 에서 제공하는 클라이언트 라이브러리와 API 는 서로 전혀 호환되지 않지만 SQL 을 이용한다는 공통의 방식이 있습니다.

이 공통 방식을 추상화 한 것이 JDBC 입니다.

트랜잭션 처리 코드에도 추상화를 도입하여 트랜잭션 경계설정 코드를 만들 수 있을 것 입니다.

#### 스프링의 트랜잭션 서비스 추상화

스프링이 제공하는 트랜잭션 추상화 계층구조입니다.

<Image img={require('./05-6.png')} />

스프링이 제공하는 트랜잭션 추상화 방법을 UserService 에 적용해봅니다.

```java title="UserService.java"
public void upgradeLevels() {
  // highlight-start
  PlatformTransactionManager transactionManager = new DataSourceTranseactionManager(dataSource);
  TransactionStatus status = this.transactionManager.getTransaction(new DefaultTransactionDefinition());
  // highlight-end
  
  try {
    List<User> users = userDao.getAll();
    for (User user : users) {
      if (canUpgradeLevel(user)) {
        upgradeLevel(user);
      }
    }
    this.transactionManager.commit(status);
  } catch (RuntimeException e) {
    this.transactionManager.rollback(status);
    throw e;
  }
}
```

JDBC 를 이용할 때는 먼저 Connection 을 생성하고 트랜잭션을 시작했지만, PlatformTransactionManager 에서는 getTransaction() 메소드를 호출하면 됩니다.

시작된 트랜잭션은 TransactionStatus 타입의 변수에 저장되어 있다가 PlatformTransactionManager 의 commit(), rollback() 시에 파라미터로 전달됩니다. 

테스트를 통해 트랜잭션이 정상적으로 동작함을 알 수 있습니다.

#### 트랜잭션 기술 설정의 분리

UserService 코드를 JTA 를 이용하는 글로벌 크랜잭션으로 변경하려면 DataSourceTranseactionManager 구현 클래스를 JPATransactionManager 로 바꿔주면 됩니다.

모두 PlatformTransactionManager 인터페이스를 구현하였기 때문에 트랜잭션 경계설정을 위한 getTransaction(), commit(), rollback() 메소드를 수정할 필요가 없습니다.

이제 UserService 가 트랜잭션 매니저를 DI 를 통해 주입받도록 바꾸면 됩니다.

```java title="UserService.java"
public class UserService {

  // ...
	
	// highlight-start
	private PlatformTransactionManager transactionManager;

	public void setTransactionManager(PlatformTransactionManager transactionManager) {
		this.transactionManager = transactionManager;
	}
	// highlight-end

	public void upgradeLevels() {
	  // highlight-next-line
		TransactionStatus status = this.transactionManager.getTransaction(new DefaultTransactionDefinition());
		try {
			List<User> users = userDao.getAll();
			for (User user : users) {
				if (canUpgradeLevel(user)) {
					upgradeLevel(user);
				}
			}
			this.transactionManager.commit(status);
		} catch (RuntimeException e) {
			this.transactionManager.rollback(status);
			throw e;
		}
	}
	
}
```

테스트의 upgradeAllOrNothing() 메소드는 수정이 필요합니다.

스프링 컨테이너로부터 transactionManager 빈을 주입받아서 전달해주도록 변경합니다.

```
public class UserServiceTest {

  // ...
  
  // // highlight-start
  @Autowired
  PlatformTransactionManager transactionManager;
  // // highlight-end
  
  @Test
	public void upgradeAllOrNothing() {
		UserService testUserService = new TestUserService(users.get(3).getId());  
		testUserService.setUserDao(this.userDao);
		// highlight-next-line
		testUserService.setTransactionManager(this.transactionManager);
		testUserService.setMailSender(this.mailSender);
		 
		userDao.deleteAll();			  
		for(User user : users) userDao.add(user);
		
		try {
			testUserService.upgradeLevels();   
			fail("TestUserServiceException expected"); 
		}
		catch(TestUserServiceException e) { 
		}
		
		checkLevelUpgraded(users.get(1), false);
	}
```

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