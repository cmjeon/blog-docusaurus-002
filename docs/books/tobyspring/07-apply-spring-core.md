---
title: 7장 스프링 핵심 기술의 응용
sidebar_position: 7
last_update:
  author: cm jeon
  date: 2023-01-10
description: ""
tags: ["Toby's Spring"]
keywords: ['스프링']
---

import Image from '@theme/IdealImage';

스프링의 3대 핵심 기술인 IoC/DI, 서비스 추상화, AOP 에 대해 간단히(?) 살펴보았습니다.

이번 장에서는 스프링이 제공하는 세 가지 기술을 필요에 따라 응용해보면서 스프링의 개발철학과 추구하는 가치에 대해 알아보겠습니다.

## 7.1 SQL과 DAO의 분리

```java title="UserDaoJdbc.java"
// ...

public class UserDaoJdbc implements UserDao {
	
	// ...

	public void add(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
		    "insert into users(id, name, password, email, level, login, recommend) values (?,?,?,?,?,?,?)",
		    user.getId(), 
		    user.getName(), 
		    user.getPassword(), 
		    user.getEmail(), 
		    user.getLevel().intValue(), 
		    user.getLogin(), 
		    user.getRecommend());
	}

	public User get(String id) {
		return this.jdbcTemplate.queryForObject(
		    // highlight-next-line
		    "select * from users where id = ?",
				new Object[] {id}, 
				this.userMapper);
	} 

	public void deleteAll() {
	  // highlight-next-line
		this.jdbcTemplate.update("delete from users");
	}

	public int getCount() {
	  // highlight-next-line
		return this.jdbcTemplate.queryForInt("select count(*) from users");
	}

	public List<User> getAll() {
	  // highlight-next-line
		return this.jdbcTemplate.query("select * from users order by id",this.userMapper);
	}

	public void update(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
		    "update users set name = ?, password = ?, email = ?, level = ?, login = ?, recommend = ? where id = ? ", 
		    user.getName(), 
		    user.getPassword(), 
		    user.getEmail(), 
		    user.getLevel().intValue(), 
		    user.getLogin(), 
		    user.getRecommend(),
		    user.getId());		
	}
	
}
```

데이터 액세스 로직이 바뀌지 않더라도 DB 의 테이블, 필드 이름과 SQL 문장이 바뀔 수 있습니다.

현재로서는 SQL 변경이 필요한 상황이 발생하면 SQL 을 담고 있는 DAO 코드가 수정되어야 합니다.

7 장에서는 DAO 에서 SQL 을 분리하도록 하겠습니다.

<!--truncate-->

### 7.1.1 XML 설정을 이용한 분리

SQL 을 스프링의 XML 설정파일로 분리할 수 있습니다.

#### 개별 SQL 프로퍼티 방식

먼저 add() 메소드의 SQL 을 외부로 빼는 작업을 해보겠습니다.

add() 메소드에서 사용할 SQL 을 외부에서 DI 받을 수 있게 하겠습니다.

```java title="UserDaoJdbc.java"
// ...

public class UserDaoJdbc implements UserDao {

  // ...
  
  // highlight-next-line
  private String sqlAdd;
  
  // highlight-start
  public void setSqlAdd(String sqlAdd) {
    this.sqlAdd = sqlAdd;
  }
  // highlight-end
  
  public void add(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
				this.sqlAdd, 
		    user.getId(), 
		    user.getName(), 
		    user.getPassword(), 
		    user.getEmail(), 
		    user.getLevel().intValue(), 
		    user.getLogin(), 
		    user.getRecommend());
	}

}
```

그리고 XML 설정파일에서 userDao 빈에 sqlAdd 프로퍼티를 추가합니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
						
  <bean id="userDao" class="springbook.user.dao.UserDaoJdbc">
		<property name="dataSource" ref="dataSource" />
		// highlight-next-line
		<property name="sqlAdd" value="insert into users (id, name, password, email, level, login, recommend) values(?, ?, ?, ?, ?, ?, ?)" />
		// get, delete ...
	</bean>
	
	// ...
	
</beans>
```

UserDaoTest 를 통해 테스트해보면 테스트는 성공합니다.

이것으로 add() 메소드에서 사용하는 SQL 은 XML 설정만을 바꿔서 수정하는 것이 가능해졌습니다.

하지만 이 방법은 매번 새로운 SQL 이 필요할 때마다 프로퍼티를 추가하고 DAO 에는 변수와 수정자 메소드를 생성해주는 불편함이 있습니다.

#### SQL 맵 프로퍼티 방식

SQL 을 하나의 컬렉션에 담아두는 방법을 생각해봅니다.

Map 을 이용하면 키 값으로 SQL 문장을 가져올 수 있습니다.

이번엔 Map 타입의 sqlMap 프로퍼티를 추가합니다.

기존의 sqlAdd 변수는 삭제합니다.

```java title="UserDaoJdbc.java"
// ...

public class UserDaoJdbc implements UserDao {

  // sqlAdd 변수와 수정자 삭제
  
  // highlight-next-line
  private Map<String, String> sqlMap;
  
  // highlight-start
  public void setSqlMap(Map<String, String> sqlMap) {
    this.sqlMap = sqlMap;
  }
  // highlight-end
  
  public void add(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
				this.sqlMap.get("add"), 
		    user.getId(), 
		    user.getName(), 
		    user.getPassword(), 
		    user.getEmail(), 
		    user.getLevel().intValue(), 
		    user.getLogin(), 
		    user.getRecommend());
	}

}
```

설정정보 XML 에도 Map 프로퍼티를 추가합니다.

Map 프로퍼티는 `<map>` 태그와 `<entry>` 태그를 사용하여 정의합니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
						
  <bean id="userDao" class="springbook.user.dao.UserDaoJdbc">
		<property name="dataSource" ref="dataSource" />
		// highlight-start
		<property name="sqlMap">
			<map>
				<entry key="add" value="insert into users (id, name, password, email, level, login, recommend) values(?, ?, ?, ?, ?, ?, ?)" />			
				// get, delete ...
			</map>
		</property>
		// highlight-end
	</bean>
	
	// ...
	
</beans>
```

이제 새로운 SQL 이 필요하면 설정에 `<entry>` 를 만들고 SQL 을 추가하면 됩니다.

하지만 SQL 을 가져올 때 문자열로 된 키 값을 사용하기 때문에 오타가 있어도 발견하기 어렵다는 문제가 있습니다.

### 7.1.2 SQL 제공 서비스

SQL 을 코드에서 분리는 하였지만 몇 가지 문제점이 있습니다.

데이터 액세스 로직의 일부인 SQL 문장을 애플리케이션 구성정보를 가진 설정정보와 함께 두는 건 바람직하지 못합니다.

SQL 을 따로 분리되어야 독립적으로 SQL 리뷰나 튜닝 작업을 하기 편합니다.

스프링의 설정파일로부터 생성되는 오브젝트와 정보는 애플리케이션을 다시 시작하기전에는 변경이 매우 어렵습니다.

따라서 독립적인 SQL 제공 서비스가 필요합니다.

#### SQL 서비스 인터페이스

클라이언트인 DAO 를 SQL 서비스의 구현에서 독립시키기 위해서는 인터페이스를 만들고, DI 로 구현 클래스의 오브젝트를 주입해주어야 합니다.

지금까지 우리가 반복적으로 해왔던 일입니다.

이제 DAO 는 적절한 키를 제공하고 그에 대한 SQL 을 돌려받도록 할 것 입니다.

SqlService 인터페이스를 만들고 메소드를 정의합니다.

```java title="SqlService.java"
public interface SqlService {

	String getSql(String key) throws SqlRetrievalFailureException;
	
}
```

해당 메소드를 수행중에 실패하면 SqlRetrievalFailureException 예외를 던집니다.

복구가 불가능하기 때문에 런타임 예외로 정의해둡니다.

SqlRetrievalFailureException 클래스를 정의하고 메시지와 원인이 되는 예외를 담을 수 있도록 합니다.

```java title="SqlRetrievalFailureException.java"
public class SqlRetrievalFailureException extends RuntimeException {

	public SqlRetrievalFailureException() {
		super();
	}

	public SqlRetrievalFailureException(String message) {
		super(message);
	}

	public SqlRetrievalFailureException(Throwable cause) {
		super(cause);
	}

	public SqlRetrievalFailureException(String message, Throwable cause) {
		super(message, cause);
	}
	
}
```

이제 UserDaoJdbc 에 SqlService 인터페이스를 정의하고, 메소드도 수정합니다.

```java title="UserDaoJdbc.java"
// ...

public class UserDaoJdbc implements UserDao {

  // highlight-next-line
  private SqlService sqlService;
  
  // highlight-start
  public void setSqlService(SqlService sqlService) {
    this.sqlService = sqlService;
  }
  // highlight-end
  
  // ...
  
  public void add(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
				this.sqlService.getSql("userAdd"), 
				user.getId(), 
				user.getName(), 
				user.getPassword(), 
				user.getEmail(), 
				user.getLevel().intValue(), 
				user.getLogin(), 
				user.getRecommend());
	}

	public User get(String id) {
		return this.jdbcTemplate.queryForObject(
		    // highlight-next-line
		    this.sqlService.getSql("userGet"),
				new Object[] {id}, 
				this.userMapper);
	}

	public void deleteAll() {
	  // highlight-next-line
		this.jdbcTemplate.update(this.sqlService.getSql("userDeleteAll"));
	}

	public int getCount() {
	  // highlight-next-line
		return this.jdbcTemplate.queryForInt(this.sqlService.getSql("userGetCount"));
	}

	public List<User> getAll() {
	  // highlight-next-line
		return this.jdbcTemplate.query(this.sqlService.getSql("userGetAll"), this.userMapper);
	}

	public void update(User user) {
		this.jdbcTemplate.update(
		    // highlight-next-line
				this.sqlService.getSql("userUpdate"),
		    user.getName(), 
		    user.getPassword(), 
		    user.getEmail(), 
		    user.getLevel().intValue(), 
		    user.getLogin(), 
		    user.getRecommend(),
		    user.getId());
	}
  
}
```

#### 스프링 설정을 사용하는 단순 SQL 서비스

이제 SqlService 를 구현한 SimpleSqlService 를 생성합니다.

기존 UserDaoJdbc 에서 사용한 Map 타입의 프로퍼티를 이용하여 만들어 봅니다.

```java title="SimpleSqlService.java"
// ...

public class SimpleSqlService implements SqlService {
	
	// highlight-next-line
	private Map<String, String> sqlMap;
	
	// highlight-start
	public void setSqlMap(Map<String, String> sqlMap) {
		this.sqlMap = sqlMap;
	}
	// highlight-end

	public String getSql(String key) throws SqlRetrievalFailureException {
		String sql = sqlMap.get(key);
		if (sql == null)  
			throw new SqlRetrievalFailureException(key + "를 이용해서 SQL을 찾을 수 없습니다");
		else
			return sql;
	}
}
```

설정정보 XML 에 SimpleSqlService 를 빈으로 등록하고 sqlMap 을 프로퍼티로 등록합니다.

그리고 SimpleSqlService 빈을 UserDaoJdbc 가 사용하도록 설정합니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
	
	<bean id="userDao" class="springbook.user.dao.UserDaoJdbc">
		<property name="dataSource" ref="dataSource" />
		// highlight-next-line
		<property name="sqlService" ref="sqlService" />
	</bean>
	
	// highlight-start
	<bean id="sqlService" class="springbook.user.sqlservice.SimpleSqlService">
		<property name="sqlMap">
			<map>
				<entry key="userAdd" value="insert into users(id, name, password, email, level, login, recommend) values(?,?,?,?,?,?,?)" />			
				// get, delete ...
			</map>
		</property>
	</bean>
	// highlight-end
	
	// ...
	
</beans>
```

이제 UserDaoJdbc 는 SQL 을 어디에 저장해두고 가져오는지에 대해 전혀 신경 쓰지 않아도 됩니다.

SqlService 인터페이스 타입의 빈을 DI 받고, 그 빈이 제공해주는 인터페이스를 통해 SQL 을 가져다 쓰기만 하면 됩니다.

또한 SqlService 인터페이스 타입의 빈은 DAO 에 영향을 주지 않은채로 구현된 내용을 변경할 수 있습니다.

## 7.2 인터페이스의 분리와 자기참조 빈 

### 7.2.1 XML 파일 매핑

#### JAXB

#### SQL 맵을 위한 스키마 작성과 컴파일

#### 언마샬링

### 7.2.2 XML 파일을 이용하는 SQL 서비스

#### SQL 맵 XML 파일

#### XML SQL 서비스

### 7.2.3 빈의 초기화 작업

### 7.2.4 변화를 위한 준비: 인터페이스 분리

#### 책임에 따른 인터페이스 정의

#### SqlRegistry 인터페이스

#### SqlReader 인터페이스

### 7.2.5 자기참조 빈으로 시작하기

#### 다중 인터페이스 구현과 간접 참조

#### 인터페이스를 이용한 분리

#### 자기참조 빈 설정

### 7.2.6 디폴트의존관계

#### 확장 가능한 기반 클래스

#### 디폴트 의존관계를 갖는 빈 만들기

## 7.3 서비스 추상화 적용

### 7.3.1 OXM 서비스추상화

#### OXM 서비스 인터페이스

#### JAXB 구현 테스트

#### Castor 구현 테스트

### 7.3.2 OXM 서비스 추상화 적용

#### 멤버 클래스를 참조하는 통합 클래스

#### 위임을 이용한 BaseS이Service의 재사용

### 7.3.3 리소스추상화

#### 리소스 로더

#### Resource! 이용해 XML 파일 가져오기

## 7.4 인터페이스 상속을 통한 안전한 기능확장

### 7.4.1 디와기능의확장

#### DI를 의식하는 설계

#### DI와 인터페이스 프로그래밍

### 7.4.2 인터페이스상속

## 7.5 DI를 이용해 다양한 구현 방법 적용하기

### 7.5.1 ConcurrentHashMapg 이용한 수정 가능 SQL 레지스트리

#### 수정 가능 SQL 레지스트리 테스트

#### 수정 가능 SQL 레지스트리 구현

### 7.5.2 내장형 데이터베이스를 이용한 SQL 레지스트리 만들기

#### 스프링의 내장형 DB 지원 기능

#### 내장형 DB 빌더 학습 테스트

#### 내장형 DB를 이용한 SqlRegistry 만들기

#### UpdatableSqlRegistry 테스트 코드의 재사용

#### XML 설정을 통한 내장형 DB의 생성과 적용

### 7.5.3 트랜잭션 적용

#### 다중 SQL 수정에 대한 트랜잭션 테스트

#### 코드를 이용한 트랜잭션 적용

## 7.6 스프링 3.1의 DI

#### 자바 언어의 변화와 스프링

### 7.6.1 자바코드를이용한빈설정

#### 테스트 컨텍스트의 변경

#### \<context:annotation-config /\> 제거

#### \<bean\> 의 전환

#### 전용 태그 전환

### 7.6.2 빈 스캐닝과 자동와이어링

#### @Autowired를 이용한 자동와이어링

#### ©Component를 이용한 자동 빈 등록

### 7.6.3 컨텍스트분리와 @Import

#### 테스트용 컨텍스트 분리

### 7.6.4 프로파일

#### 컨테이너의 빈 등록 정보 확인

#### 중첩 클래스를 이용한 프로파일 적용

### 7.6.5 프로퍼티 소스

#### @PropertySource

### 7.6.6 빈 설정의 재사용과 @Enable*

#### 빈 설정자

#### ©Enable* 애노테이션

## 7.7 정리


