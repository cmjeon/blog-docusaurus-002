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

SQL 에서 DAO 를 분리합니다.

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

SQL 정보는 SQL 을 저장해두는 전용 포맷을 가진 독립적인 파일을 이용하는 편이 바람직합니다.

SQL 정보를 담는 XML 문서를 만들고, 이 파일에서 SQL 을 읽어뒀다가 DAO 에 제공해주는 SQL 서비스 구현 클래스를 만들어보겠습니다.

#### JAXB

JAXB(Jav Architecture for XML Binding) 을 이용하여 파일을 읽어오도록 해보겠습니다.

JAXB 는 클래스를 만들 수 있는 컴파일러를 제공해주는데, 이 컴파일러에 스키마를 이용하면 클래스를 만들 수 있습니다. 

이 클래스로 XML 파일의 정보를 매핑할 오브젝트를 생성하고, 오브젝트에는 매핑정보가 애노테이션으로 담기게 됩니다.

#### SQL 맵을 위한 스키마 작성과 컴파일

SQL 정보를 담은 XML 문서를 만듭니다.

```xml title="sqlmap.xml"
<?xml version="1.0" encoding="UTF-8"?>
<sqlmap ... >
  <sql key="userAdd">...</sql>
  <sql key="userGet">...</sql>
</sqlmap>
```

그리고 XML 문서 구조를 정의하고 있는 스키마 파일을 만듭니다.

```xml title="sqlmap.xsd"
<?xml version="1.0" encoding="UTF-8"?>
<schema ...>
  <element name="sqlmap">
    <complexType>
      <sequence>
        <element name="sql" maxOccurs="unbounded" type="tns:sqlType" />
      </sequence>
    </complexType>
  </element>
  <complexType name="sqlType">
    <simpleContent> ... </simpleContent>
  </complexType>
</schema>
```

스키마 파일을 JAXB 컴파일러에 이용해서 컴파일하면 클래스파일이 생성됩니다.

팩토리 클래스와 2개의 바인딩용 클래스가 생성됩니다.

```shell
# 팩토리 클래스
ObjectFactory.java
# 바인딩용 클래스
SqlType.java
Sqlmap.java
```

클래스를 이용해 오브젝트를 생성하면 XML 정보가 오브젝트로 전환하는 방법을 확인하게 된 것입니다.

#### 언마샬링

XML 문서를 읽어서 자바의 오브젝트로 변환하는 것을 JAXB 에서는 언마샬링 unmarshalling 이라고 부릅니다.

반대로 오브젝트를 XML 문서로 변환하는 것을 marshalling 이라고 합니다.

오브젝트를 바이트 스트림으로 바꾸는 것을 직렬화 serialization 이라고 부르는 것과 비슷합니다.

### 7.2.2 XML 파일을 이용하는 SQL 서비스

#### SQL 맵 XML 파일

SQL 문서는 DAO 의 로직의 일부라고 볼 수 있으므로 DAO 와 같은 패키지에 두는 게 좋습니다.

#### XML SQL 서비스

sqlmap.xml 에 있는 SQL 을 가져와 DAO 에 제공해주는 SqlService 구현클래스를 만들어봅니다.

JAXB 로 XML 문서를 언마샬링하면 `<sql>` 태그 하나는 Sql 클래스의 오브젝트에 하나씩 담깁니다.

생성자에서 JAXB 를 이용해 XML 로 된 SQL 문서를 읽어드리고, 변환된 Sql 오브젝트들을 맵으로 옮겨서 저장합니다.

그리고 DAO 의 요청에 따라 SQL 을 찾아서 반환합니다.

```java title='XmlSqlService.java"
public class XmlSqlService implements SqlService {
  
  // SQL 을 저장하는 map
  // highlight-next-line
  private Map<String, String> sqlMap = new HashMap<String, String>();

  public XmlSqlService() {
    // 
    // highlight-start
    String contextPath = Sqlmap.class.getPackage().getName(); 
    try {
      JAXBContext context = JAXBContext.newInstance(contextPath);
      Unmarshaller unmarshaller = context.createUnmarshaller();
      InputStream is = UserDao.class.getResourceAsStream("sqlmap.xml");
      Sqlmap sqlmap = (Sqlmap)unmarshaller.unmarshal(is);
      // highlight-end

      for(SqlType sql : sqlmap.getSql()) {
        sqlMap.put(sql.getKey(), sql.getValue());
      }
    } catch (JAXBException e) {
      throw new RuntimeException(e);
    } 
  }

  public String getSql(String key) throws SqlRetrievalFailureException {
    String sql = sqlMap.get(key);
    if (sql == null)  
      throw new SqlRetrievalFailureException(key + "를 이용해서 SQL을 찾을 수 없습니다");
    else
      return sql;
  }
}
```

이렇게 SQL 문장을 스프링의 빈 설정에서도 분리하는데 성공했습니다.

### 7.2.3 빈의 초기화 작업

XmlSqlService 코드를 살펴보면 몇 가지 개선점이 보입니다.

생성자에서 예외가 발생할 수도 있는 복잡한 초기화 작업을 다루는 것은 좋지 않습니다.

초기 상태를 가진 오브젝트를 만들어놓고 별도의 초기화 메소드를 사용하는 방법이 바람직합니다.

또한 SQL 을 담은 XML 파일의 위치가 코드에 고정되는 것도 좋지 않습니다.

바뀔 가능성이 있는 내용은 외부에서 DI 로 설정해줄 수 있게 만들어야 합니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService {

  // XML 파일의 위치를 DI 받을 수 있게 변경
  // highlight-start 
  public void setSqlmapFile(String sqlmapFile) {
    this.sqlmapFile = sqlmapFile;
  }
  // highlight-end
  
  // 초기화 메소드를 선언
  public void loadSql() {
    String contextPath = Sqlmap.class.getPackage().getName(); 
    try {
      // ...
      // hightlight-next-line
      InputStream is = UserDao.class.getResourceAsStream(this.sqlmapFile);
      // ...
    } catch (JAXBException e) {
      throw new RuntimeException(e);
    } 
  }

}
```

XmlSqlService 오브젝트는 빈이기 때문에 제어권이 스프링에 있습니다.

빈 후처리기는 스프링 컨테이너가 빈을 생성한 뒤 부가적인 작업을 수행할 수 있게 해주는 기능입니다.

AOP 를 위한 프록시 자동생성기가 대표적인 빈 후처리기 입니다.

context 네임스페이스를 사용해서 `<context:annotation-config/>` 태그를 만들어서 설정파일에 넣어주면 빈 설정 기능에 사용할 수 있는 특별한 애노테이션 기능을 부여해주는 빈 후처리기들이 등록됩니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ...
  xmlns:context="http://www.springframework.org/schema/context"
  xsi:schemaLocation="http://www.springframework.org/schema/beans 
            ...
            http://www.springframework.org/schema/context 
            http://www.springframework.org/schema/context/spring-context-3.0.xsd
            ...">
  
  // highlight-next-line          
  <context:annotation-config /> // 코드의 애노테이션을 이용한 빈 설정 및 초기화 작업을 해주는 빈 후처리기 등록            
            
  // highlight-next-line
  <tx:annotation-driven /> // @Transactional 이 붙은 타입과 메소드에 트랜잭션 부가기능을 담은 프록시를 추가하도록 만들어주는 후처리기 등록
  
</beans>
```

스프링은 @PostConstruct 애노테이션을 빈 오브젝트의 초기화 메소드를 지정하는 데 사용합니다.

@PostConstruct 애노테이션을 초기화 작업을 수행할 메소드에 부여해줍니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService {

  // 초기화 메소드를 선언
  @PostConstruct
  public void loadSql() {
    // ... 
  }
  
}
```

스프링은 XmlSqlService 클래스로 등록된 빈의 오브젝트를 생성하고 DI 작업을 마친 뒤 @PostConstruct 가 붙은 메소드를 자동으로 실행해줍니다.

프로퍼티까지 모두 준비된 후에 실행된다는 면에서 @PostConstruct 초기화 메소드는 매우 유용합니다.

이제 sqlmapFile 프로퍼티의 값을 sqlService 빈의 설정에 넣어줍니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
  // ...
  // highlight-start
  <bean id="sqlService" class="springbook.user.sqlservice.XmlSqlService">
    <property name="sqlmapFile" value="sqlmap.xml" />
  </bean>
  // highlight-end
</beans>
```

아래는 스프링 컨테이너의 초기 작업 순서입니다.

<Image img={require('./07-2.png')} />

### 7.2.4 변화를 위한 준비: 인터페이스 분리

현재 XmlSqlService 는 SQL 을 특정 포맷의 XML 에서 SQL 데이터를 가져오고 있습니다.

만약 가져온 SQL 정보를 HashMap 타입 컬렉션이 아닌 다른 방식으로 저장해두고 사용하려면 지금까지 만든 코드를 변경해야 합니다.

SQL 을 가져오는 것과 보관해두고 사용하는 것은 각각 독자적으로 변경가능한 독립적인 부분입니다.

#### 책임에 따른 인터페이스 정의

먼저 분리가능한 관심사를 구분해봅니다.

첫째로 SQL 정보를 외부의 리소스로부터 읽어오는 것 입니다.

두번째는 읽어온 SQL 을 보관해두고 필요할 때 제공해주는 것 입니다.

부가적으로 생각해 볼 수 있는 것은 한 번 가져온 SQL 을 필요에 따라 수정할 수 있게 하는 것입니다.

SqlService 의 구현 클래스가 각각의 책임을 가진 SqlReader 와 SqlRegistry 두 가지 타입의 오브젝트를 사용하도록 만듭니다.

<Image img={require('./07-3.png')} />

구조상 SqlReader 가 읽어온 SQL 정보가 다시 SqlRegistry 에 전달되서 등록되어야 합니다.

SqlReader 가 SQL 정보를 가져와서 SqlRegistry 에 전달하는 방법을 Map 을 이용하는 방식으로 생각할 수도 있습니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService {
  // ...
  
  Map<String, String> sqls = sqlReader.readSql();
  sqlRegistry.addSqls(sqls);
  
  // ...
}
```

하지만 SqlReader 와 SqlRegistry 는 각각 SQL 정보를 읽어 가져오는 방법과 이를 저장해두는 방법의 구현으로부터 독립적인 인터페이스로 만들어져야 합니다.

따라서 이 둘 사이에서 정보를 전달하기 위해 일시적으로 Map 타입의 형식을 갖도록 만들어지는 것은 바람직하지 않습니다.

SqlReader 에서 내부의 구현방식으로 SQL 정보를 읽어와서는 Map 으로 바꿔주고, SqlRegistry 에서도 Map 으로 읽은 정보를 다시 내부의 구현방식으로 바꿔야하는 과정이 필요할 것입니다.

SqlReader 에게 SqlRegistry 전략을 제공해주면서 이를 이용해서 SQL 정보를 SqlRegistry 에 저장하라고 요청하는 방식을 생각해 볼 수 있습니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService {
  // ...
  
  sqlReader.readSql(sqlRegistry);
  
  // ...
}
```

자바의 오브젝트는 데이터를 가질 수 있습니다.

자신이 가진 데이터를 이용해 어떻게 작업해야 할지도 가장 잘 알고 있습니다.

그렇다면 오브젝트 스스로 자신의 데이터로 충실히 작업하게 만들면 됩니다.

SqlReader 는 내부의 정보를 형식을 바꿔서 반환하는 대신에 협력관계에 있는 의존 오브젝트인 SqlRegistry 가 SQL 정보의 등록을 수행할 때 정보를 제공하면 됩니다.

아래는 SqlReader 가 SqlRegistry 와 의존관계를 가지고 작업을 진행하도록 만들었을 때의 구조입니다.

<Image img={require('./07-4.png')} />

SqlService 는 SqlReader 가 사용할 SqlRegistry 오브젝트를 제공해주는 역할을 합니다.

SqlReader 입장에서는 SqlRegistry 의 오브젝트를 런타임 시에 제공받으니 일종의 수동 DI 입니다.

SqlRegistry 는 SqlService 에 등록된 SQL 을 검색해서 돌려주는 기능을 하기에 SqlService 가 의존하는 오브젝트이기도 합니다.

#### SqlRegistry 인터페이스

```java title="SqlRegistry.java"
public interface SqlRegistry {

  void registerSql(String key, String sql); // SQL 을 등록하는 기능

  String findSql(String key) throws SqlNotFoundException; // SQL 을 검색하는 기능
  
}
```

SQL 을 검색하는 기능은 실패할 때는 예외를 던지게 하였습니다.

코드에 버그가 있거나 설정에 문제가 있어 발생한 예외라면 복구할 가능성이 적다고 판단되어 런타임 예외로 만들었습니다. 

런타임 예외이지만 명시적으로 메소드가 던지는 예외를 선언해두는 편이 좋습니다.

#### SqlReader 인터페이스

```java title="SqlReader.java"
public interface SqlReader {

  void read(SqlRegistry sqlRegistry); SQL 정보를 읽는 기능
  
}
```

SQL 정보를 읽는 기능은 SQL 정보를 읽고, SqlRegistry 오브젝트를 파라미터로 DI 받아서 SQL 을 등록하는데 사용합니다.

### 7.2.5 자기참조 빈으로 시작하기

#### 다중 인터페이스 구현과 간접 참조

SqlService 구현 클래스는 SqlReader 와 SqlRegistry 두 개의 프로퍼티를 DI 받을 수 있는 구조이어야 합니다.

SqlService 를 포함한 3개의 인터페이스를 구현한 클래스간의 구조는 아래와 같습니다.

<Image img={require('./07-5.png')} />

인터페이스에만 의존하도 만들어야 스프링의 DI 를 적용할 수 있습니다.

DI 를 적용하지 않더라도 자신이 사용하는 오브젝트이 클래스가 어떤 것인지 알지 못하게 만드는 것이 좋습니다.

그것이 구현 클래스를 바꾸고 의존 오브젝트를 변경해서 자유롭게 확장할 기회를 제공해주는 것입니다.

3 개의 인터페이스를 하나의 클래스가 모두 구현하는 경우를 생각해 봅니다.

클래스의 구현 내용을 상속하는 extends 와 다르게 인터페이스는 한 개 이상을 상속하는 것이 가능합니다.

인터페이스도 상속이라고 표현할 수 있습니다.

인터페이스 구현은 타입을 상속하는 것이기 때문입니다.

구현 클래스가 구현은 다르지만 같은 타입을 상속받았기 때문에 다형성을 활용할 수 있습니다.

따라서 하나의 클래스가 여러 개의 인터페이스를 상속해서 여러 종류의 타입으로 존재할 수 있습니다.

<Image img={require('./07-6.png')} />

XmlSqlService 가 세 개의 인터페이스를 구현하게 해도 상관없습니다.

이제부터는 책임이 분리되지 않았던 XmlSqlService 클래스가 책임을 정의한 인터페이스를 구현하도록 만들어 보겠습니다.

#### 인터페이스를 이용한 분리

먼저 XmlSqlService 는 SqlService 인터페이스만의 구현 클래스라고 생각하면 다른 두 개의 인터페이스 타입 오브젝트에 의존하는 구조여야 합니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService {

  private SqlReader sqlReader;
  private SqlRegistry sqlRegistry;

  public void setSqlReader(SqlReader sqlReader) {
    this.sqlReader = sqlReader;
  }

  public void setSqlRegistry(SqlRegistry sqlRegistry) {
    this.sqlRegistry = sqlRegistry;
  }

  // ...

}
```

다음으로 XmlSqlService 가 SqlRegistry 를 구현하도록 합니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService, SqlRegistry {

  // ...

  // highlight-next-line
  private Map<String, String> sqlMap = new HashMap<String, String>();

  public String findSql(String key) throws SqlNotFoundException {
    String sql = sqlMap.get(key);
    if (sql == null)
      throw new SqlRetrievalFailureException(key + "를 이용해서 SQL을 찾을 수 없습니다");
    else
      return sql;
  }

  public void registerSql(String key, String sql) {
    sqlMap.put(key, sql);
  }

  // ...

}
```

마지막 인터페이스인 SqlReader 를 구현합니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService, SqlRegistry, SqlReader {

  // ...

  private String sqlmapFile;

  public void setSqlmapFile(String sqlmapFile) {
    this.sqlmapFile = sqlmapFile;
  }

  // highlight-next-line
  public void read(SqlRegistry sqlRegistry) {
    String contextPath = Sqlmap.class.getPackage().getName(); 
    try {
      JAXBContext context = JAXBContext.newInstance(contextPath);
      Unmarshaller unmarshaller = context.createUnmarshaller();
      InputStream is = UserDao.class.getResourceAsStream(sqlmapFile);
      Sqlmap sqlmap = (Sqlmap)unmarshaller.unmarshal(is);
      for(SqlType sql : sqlmap.getSql()) {
        // highlight-next-line
        sqlRegistry.registerSql(sql.getKey(), sql.getValue());
      }
    } catch (JAXBException e) {
      throw new RuntimeException(e);
    }     
  }

}
```

SqlReader 의 구현 코드에서 SqlRegistry 구현 코드의 내부정보에 직접 접근해서는 안됩니다.

따라서 파라미터로 전달받은 SqlRegistry 의 메소드를 사용해야만 합니다.

@PostConstruct 가 달린 초기화 메소드와 getFinder() 메소드가 sqlReader 와 sqlRegistry 를 사용하도록 변경합니다.

```java title="XmlSqlService.java"
public class XmlSqlService implements SqlService, SqlRegistry, SqlReader {

  @PostConstruct
  public void loadSql() {
    // highlight-next-line
    this.sqlReader.read(this.sqlRegistry);
  }

  public String getSql(String key) throws SqlRetrievalFailureException {
    // highlight-start
    try {
      return this.sqlRegistry.findSql(key);
    } 
    catch(SqlNotFoundException e) {
      throw new SqlRetrievalFailureException(e);
    }
    // highlight-end
  }
  
}
```

loadSql() 메소드에서는 sqlReader 가 sqlRegistry 를 파라미터로 받아서 SQL 을 읽고 저장하도록 합니다.

getSql() 메소드에서는 SqlRegistry 타입의 오브젝트에게 요청해서 findSql() 메소드를 실행해 SQL 을 검색하게 하고, 발생하는 예외를 SqlService 인터페이스에서 정의한 예외로 전환해줍니다.

#### 자기참조 빈 설정

여기까지 XmlSqlService 클래스 안의 코드들을 세 가지 인터페이스를 구현하는 방법으로 분리했습니다.

같은 클래스 안의 내용이지만 다른 인터페이스를 통해 SQL 을 읽을 때는 SqlReader 인터페이스를 통하고, SQL 을 검색할 때는 SqlRegistry 인터페이스를 통해 접근하도록 하였습니다.

이제 빈 설정으로 DI 가 일어나도록 합니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
  // ...
  // highlight-start
  <bean id="sqlService" class="springbook.user.sqlservice.XmlSqlService">
    <property name="sqlReader" ref="sqlService" />
    <property name="sqlRegistry" ref="sqlService" />
    <property name="sqlmapFile" value="sqlmap.xml" />
  </bean>
  // highlight-end
</beans>
```

스프링은 프로퍼티의 ref 항목에 자기 자신을 넣는 것을 허용합니다.

이를 통해 sqlService 를 구현한 메소드와 초기화 메소드는 외부에서 DI 된 오브젝트라고 생각하게 됩니다.

자기 자신을 참조하는 빈은 사실 흔히 쓰이는 방법은 아닙니다.

책임이 다르다면 클래스를 구분하고 각기 다른 오브젝트로 만들어지는 것이 자연스럽습니다.

다만 자기참조 빈을 만들어보는 것은 책임과 관심사가 복잡하게 얽혀 있어서 확장이 힘들고 변경에 취약한 클래스를 유연한 구조로 만들려고 할 때 처음 시도해볼 수 있는 방법입니다.

이를 통해 기존의 복잡하게 얽혀 있던 코드를 책임을 가진 단위로 구분해낼 수 있습니다.

### 7.2.6 디폴트의존관계

#### 확장 가능한 기반 클래스

이제 XmlSqlService 의 세가지 기능을 분리하고 DI 로 조합하여 사용하게 만들어 봅니다.

기본 클래스를 BaseSqlService 로 합니다.

```java title="BaseSqlService.java"
public class BaseSqlService implements SqlService {
  // highlight-start
  private SqlReader sqlReader;
  private SqlRegistry sqlRegistry;
  // highlight-end
    
  public void setSqlReader(SqlReader sqlReader) {
    this.sqlReader = sqlReader;
  }

  public void setSqlRegistry(SqlRegistry sqlRegistry) {
    this.sqlRegistry = sqlRegistry;
  }

  @PostConstruct
  public void loadSql() {
    this.sqlReader.read(this.sqlRegistry);
  }

  public String getSql(String key) throws SqlRetrievalFailureException {
    try {
      return this.sqlRegistry.findSql(key);
    } 
    catch(SqlNotFoundException e) {
      throw new SqlRetrievalFailureException(e);
    }
  }
}
```

BaseSqlService 를 SqlService 빈으로 등록하고 SqlReader 와 SqlRegistry 를 구현한 클래스도 빈으로 등록하여 DI 해줍니다.

HashMap 을 이용한 SqlRegistry 코드도 독립 클래스 HashMapSqlRegistry.java 로 분리합니다.

```java title="HashMapSqlRegistry.java"
public class HashMapSqlRegistry implements SqlRegistry {
  // ...
}
```

JAXB 를 이용한 SqlReader 코드로 독립 클래스 JaxbXmlSqlReader.java 로 분리합니다.

```java title="JaxbXmlSqlReader.java"
public class JaxbXmlSqlReader implements SqlReader {
  // ...
}
```

빈 설정도 변경해 줍니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
  // ...
  // highlight-start
  <bean id="sqlService" class="springbook.user.sqlservice.BaseSqlService">
    <property name="sqlReader" ref="sqlReader" />
    <property name="sqlRegistry" ref="sqlRegistry" />
  </bean>
  
  <bean id="sqlReader" class="springbook.user.sqlservice.JaxbXmlSqlReader">
    <property name="sqlmapFile" value="sqlmap.xml" />
  </bean>
  
  <bean id="sqlRegistry" class="springbook.user.sqlservice.HashMapSqlRegistry">
  </bean>
  // highlight-end
</beans>
```

#### 디폴트 의존관계를 갖는 빈 만들기

확장을 고려해 기능을 분리하고, 인터페이스와 전략 패턴을 도입하면 늘어난 클래스와 인터페이스 구현, 그리고 의존관계 설정에 대한 부담을 감수해야 합니다.

특정 의존 오브젝트가 대부분의 환경에서 디폴트라면 디폴트 의존관계를 갖는 빈을 만들어 볼 수도 있습니다.

:::info
디폴트 의존관계란 외부에서 DI 받지 않는 경우 기본적으로 자동 적용되는 의존관계를 말합니다.
:::

DefaultSqlService 를 만들고 사용할 디폴트 의존 오브젝트를 스스로 DI 하는 방식을 생각해볼 수 있습니다.

```java title="DefaultSqlService.java"
public class DefaultSqlService extends BaseSqlService {
  public DefaultSqlService() {
    setSqlReader(new JaxbXmlSqlReader());
    setSqlRegistry(new HashMapSqlRegistry());
  }
}
```

하지만 의존 오브젝트인 JaxbXmlSqlReader 에 프로퍼티인 sqlmapFile 을 주입할 수 없어서 테스트는 실패합니다.

DefaultSqlService 가 sqlmapFile 을 받아서 내부적으로 JaxbXmlSqlReader 만드는 방법도 있습니다.

하지만 사용여부가 불확실한 JaxbXmlSqlReader 때문에 DefaultSqlService 가 sqlmapFile 을 가지고 있는 것은 어색합니다. 

> 외부 클래스의 프로퍼티로 정의해서 전달받는 방법 자체는 나쁘지 않지만 DefaultSqlService 에 적용하기에는 적절치 않다.
> 
> 디폴트라는 건 다른 명시적인 설정이 없는 경우에 기본적으로 사용하겠다는 의미다.
> 
> DefaultSqlService 는 JaxbXmlSqlReader 를 디폴트 오브젝트로 갖고 있을 뿐, 이를 사용하지 않을 수도 있다.
> 
> 따라서 반드시 필요하지않은 sqlmapFile 을 프로퍼티로 등록해두는 것은 바람직하지 못하다.
> 
> 7장_ 스프링 핵심 기술의 응용, 595.

JaxbXmlSqlReader 부터 sqlmapFile 의 기본값을 가진 디폴트 오브젝트로 만들어 봅니다.

```java title="JaxbXmlSqlReader.java"
public class JaxbXmlSqlReader implements SqlReader {

  // highlight-start
  private final String DEFAULT_SQLMAP_FILE = "sqlmap.xml";
  private String sqlmapFile = DEFAULT_SQLMAP_FILE;
  // highlight-end

  public void setSqlmapFile(String sqlmapFile) { 
    this.sqlmapFile = sqlmapFile;
  }

  // ...
  
}
```

이렇게 하면 sqlmapFile 프로퍼티를 지정하면 지정된 파일이 사용되고, 아니면 디폴트로 선언된 파일이 사용됩니다.

DI 를 사용한다고 해서 항상 모든 프로퍼티 값을 설정에 넣고 빈으로 지정할 필요는 없습니다.

DefaultSqlService 는 SqlService 를 바로 구현한 것이 아니라 BaseSqlService 를 상속했습니다.

DefaultSqlService 는 BaseSqlService 의 sqlReader 와 sqlRegistry 프로퍼티를 그대로 가지고 있고, 또한 변경할 수 있습니다.

디폴트 의존 오브젝트를 사용하면 설정으로 다른 구현 오브젝트를 사용하더라도 일단 디폴트 의존 오브젝트를 만들어버린다는 단점이 있습니다.

이럴 때는 @PostConstruct 초기화 메소드를 이용해서 프로퍼티가 설정되었는지 확인하고 없는 경우에만 디폴트 오브젝트를 만드른 방법을 사용하면 됩니다.

## 7.3 서비스 추상화 적용

JaxbXmlSqlReader 를 개선할 부분입니다.

- 필요에 따라 JAXB 외에 다른 기술로 바꿔서 사용할 수 있게 한다.
- XML 파일을 좀 더 다양한 소스에서 가져올 수 있게 한다.

### 7.3.1 OXM 서비스추상화

XML 과 자바오브젝트를 매핑해서 상호 변환해주는 기술을 OXM Object-XML Mapping 이라고 합니다.

기능이 같은 여러가지 기술이 존재한다면 서비스 추상화를 고민해볼 수 있습니다.

> 로우레벨의 구체적인 기술과 API 에 종속되지 않고 추상화된 레이어와 API 를 제공해서 구현 기술에 대해 독립적인 코드를 작성할 수 있게 해주는 서비스 추상화가 필요하다.
>
> 스프링이 제공하는 OXM 추상 계층의 API 를 이용해서 XML 문서와 오브젝트 사이의 변환을 처리하게 하면, 코드 수정 없이도 OXM 기술을 자유롭게 바꿔서 적용할 수 있다.
> 
> 7장_ 스프링 핵심 기술의 응용, 597.

#### OXM 서비스 인터페이스

스프링의 OXM 추상화 인터페이스에는 자바 오브젝트를 MXL 로 변환하는 Marshaller 와 반대인 Unmarshaller 가 있습니다.

Unmarshaller 인터페이스의 unmarshal() 메소드는 XML 파일에 대한 정보를 담은 Source 타입의 오브젝트를 파라미터로 받으면 자바 오브젝트 트리로 변환하고 루트 오브젝트를 돌려줍니다.

#### JAXB 구현 테스트

Unmarshaller 인터페이스의 JAXB 를 사용하는 구현 클래스의 이름은 Jaxb2Marshaller 입니다.

OxmTest-context.xml 을 만들고 Jaxb2Marshaller 를 빈으로 등록해줍니다.

```xml title="OxmTest-context.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >

  <bean id="unmarshaller" class="org.springframework.oxm.jaxb.Jaxb2Marshaller">
    <property name="contextPath" value="springbook.user.sqlservice.jaxb" />
  </bean>

</beans>
```

unmarshaller 빈은 Unmarshaller 타입입니다.

@Autowired 를 이용해서 unmarshaller 빈을 가져와서 unmarshal() 메소드를 호출해주면 됩니다.

```java title="OxmTest.java"
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration
public class OxmTest {

  // highligt-start
  @Autowired
  Unmarshaller unmarshaller;
  // highligt-end
  
  @Test 
  public void unmarshallSqlMap() throws XmlMappingException, IOException  {
    Source xmlSource = new StreamSource(getClass().getResourceAsStream("sqlmap.xml"));
    // highligt-next-line
    Sqlmap sqlmap = (Sqlmap)this.unmarshaller.unmarshal(xmlSource);
    
    List<SqlType> sqlList = sqlmap.getSql();    
    assertThat(sqlList.size(), is(3));
    assertThat(sqlList.get(0).getKey(), is("add"));
    assertThat(sqlList.get(0).getValue(), is("insert"));
    assertThat(sqlList.get(1).getKey(), is("get"));
    assertThat(sqlList.get(1).getValue(), is("select"));
    assertThat(sqlList.get(2).getKey(), is("delete"));
    assertThat(sqlList.get(2).getValue(), is("delete"));
  }
}
```

#### Castor 구현 테스트

Castor 이라는 OXM 기술도 있습니다.

Castor 는 XML 매핑파일을 이용해서 변환할 수 있습니다.

```xml title="mapping.xml"
<?xml version="1.0"?>
<!DOCTYPE mapping PUBLIC "-//EXOLAB/Castor Mapping DTD Version 1.0//EN" "http://castor.org/mapping.dtd">
<mapping>
    <class name="springbook.user.sqlservice.jaxb.Sqlmap">
        <map-to xml="sqlmap" />
        <field name="sql"
               type="springbook.user.sqlservice.jaxb.SqlType"
               required="true" collection="arraylist">
            <bind-xml name="sql" node="element" />
        </field>
    </class>
    <class name="springbook.user.sqlservice.jaxb.SqlType">
        <map-to xml="sql" />
        <field name="key" type="string" required="true">
            <bind-xml name="key" node="attribute" />
        </field>
        <field name="value" type="string" required="true">
            <bind-xml node="text" />
        </field>
    </class>
</mapping>
```

이번에는 Castor 를 사용하도록 설정을 변경해 줍니다.

```xml title="OxmTest-context.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >

  <bean id="unmarshaller" class="org.springframework.oxm.castor.CastorMarshaller">
    <property name="mappingLocation" value="springbook/learningtest/spring/oxm/mapping.xml" />
  </bean>

</beans>
```

이렇게 서비스 추상화는 로우레벨의 기술을 필요에 따라 변경하면서도 일관된 애플리케이션 코드를 유지할 수 있도록 해줍니다.

### 7.3.2 OXM 서비스 추상화 적용

스프링의 OXM 추상화 기능을 이용하는 SqlService 를 만들어보겠습니다.

OxmSqlService 라고 하고 SqlReader 는 스프링의 OXM Unmarshaller 를 이용하도록 하겠습니다.

#### 멤버 클래스를 참조하는 통합 클래스

OxmSqlService 는 BaseSqlService 와 유사하게 SqlReader 타입의 의존 오브젝트를 사용하지만 스태틱 멤버 클래스로 내장하여 사용하도록 만들어보겠습니다.

내장된 SqlReader 구현을 외부에서 사용하지 못하도록 제한하고 스스로 최적화된 구조로 만들기 위해서 입니다.

> 유연성은 조금 손해보더라도 내부적으로 낮은 결합도를 유지한 채로 응집도가 높은 구현을 만들 때 유용하게 쓸 수 있는 방법이다.
> 
> , 603.

SqlReader 구현을 내장하고 있는 OxmSqlService 의 구조입니다.

<Image img={require('./07-7.png')} />

```java title="OxmSqlService.java"
public class OxmSqlService implements SqlService {

  // highlight-next-line
  private final OxmSqlReader oxmSqlReader = new OxmSqlReader();

  private class OxmSqlReader implements SqlReader {
    // ...
  }
}
```

OxmSqlReader 는 private 멤버 클래스라서 외부에서 접근하거나 사용할 수 없습니다.

또한 final 로 선언하고 직접 오브젝트를 생성하기 때문에 OxmSqlReader 를 DI 하거나 변경할 수 없습니다.

두 개의 클래스를 강하게 결합시키고 확장이나 변경에 제한을 주는 이유는 OXM 을 이용하는 서비스 구조로 최적화하기 위해서입니다.

만약 Unmarshaller 주입할 수 있게 만든다면 SqlService 를 위해 등록할 빈이 늘어나게 됩니다.

확장과 변경이 유연해지기는 하지만 이런 DI 구조가 불편하게 느껴질 수도 있습니다.

설정을 단순하게 하는 방법으로 BaseSqlService 를 확장해서 디폴트 설정을 두는 방법도 있습니다.

하지만 디폴트 의존 오브젝트를 만들어주는 방식의 한계는 디폴트로 내부에서 만드는 오브젝트의 프로퍼티는 외부에서 지정해주기 힘들다는 점이 있습니다.

따라서 하나의 빈 설정만으로 SqlService 와 SqlReader 의 필요한 프로퍼티 설정이 모두 가능하도록 만들 필요가 있습니다.

<Image img={require('./07-8.png')} />

OxmSqlReader 는 OxmSqlService 에 의해서만 만들어지기 때문에 OxmSqlReader 가 DI 로 제공받아야하는 프로퍼티는 OxmSqlService 의 프로퍼티를 통해 간접적으로 DI 받아야 합니다.

아래는 OxmSqlService 의 프로퍼티를 통해 OxmSqlReader 의 프로퍼티를 설정해주는 코드입니다.

```java title="OxmSqlService.java"
public class OxmSqlService implements SqlService {

  private final OxmSqlReader oxmSqlReader = new OxmSqlReader();

  // ...
  
  // highlight-start
  public void setUnmarshaller(Unmarshaller unmarshaller) {
    this.oxmSqlReader.setUnmarshaller(unmarshaller);
  }
  
  public void setSqlmapFile(String sqlmapFile) {
    this.oxmSqlReader.setSqlmapFile(sqlmapFile);
  }
  // highlight-end
  
  // ...
  
  private class OxmSqlReader implements SqlReader {
  
    private Unmarshaller unmarshaller;
    private final static String DEFAULT_SQLMAP_FILE = "sqlmap.xml";
    private String sqlmapFile = DEFAULT_SQLMAP_FILE;

    // ...

    // highlight-start
    public void setUnmarshaller(Unmarshaller unmarshaller) {
      this.unmarshaller = unmarshaller;
    }
    
     public void setSqlmapFile(String sqlmapFile) {
      this.sqlmapFile = sqlmapFile;
    }
    // highlight-end
    
    // ...
    
  }
}
```

이 방법은 UserDaoJdbc 안에서 JdbcTemplate 을 직접 만들어 사용할 때와 유사합니다.

OxmSqlService 가 UserDaoJdbc 와 다른 점은 UserDaoJdbc 에서는 setDataSource() 메소드에서 JdbcTemplate 오브젝트를 생성하고 DataSource 를 전달하였습니다.

OxmSqlService 의 경우 두 개의 프로퍼티가 필요하기 때문에 미리 오브젝트를 만들어주고 각 수정자 메소드에서 DI 받은 값을 oxmSqlReader 에 전달해주어야 합니다.

```java title="OxmSqlService.java"
public class OxmSqlService implements SqlService {
  
  private final OxmSqlReader oxmSqlReader = new OxmSqlReader();
  // highlight-next-line
  private SqlRegistry sqlRegistry = new HashMapSqlRegistry();
  
  // highlight-start
  public void setSqlRegistry(SqlRegistry sqlRegistry) {
    this.sqlRegistry = sqlRegistry;
  }
  // highlight-end
  
  // ...

  // highlight-start
  @PostConstruct
  public void loadSql() {
    this.oxmSqlReader.read(this.sqlRegistry);
  }

  public String getSql(String key) throws SqlRetrievalFailureException {
    try {
      return this.sqlRegistry.findSql(key);
    } catch (SqlNotFoundException e) {
      throw new SqlRetrievalFailureException(e);
    }  
  }
  // highlight-end
  
  private class OxmSqlReader implements SqlReader {
    
    // ...

    // highlight-start
    public void read(SqlRegistry sqlRegistry) {
      try {
        Source source = new StreamSource(
            UserDao.class.getResourceAsStream(this.sqlmapFile));
            
        Sqlmap sqlmap = (Sqlmap)this.unmarshaller.unmarshal(source);
        
        for(SqlType sql : sqlmap.getSql()) {
          sqlRegistry.registerSql(sql.getKey(), sql.getValue());
        }
      } catch (IOException e) {
        throw new IllegalArgumentException(this.sqlmapFile + "을 가져올 수 없습니다", e);
      }
    }
    // highlight-end
  }
}
```

SqlService 를 구현한 부분은 BaseSqlService 와 등일합니다.

SqlReader 를 DI 받을 수 없다는 것 외에는 SqlReader 인터페이스를 이용한다는 것은 동일하기 때문입니다.

OXM 을 적용했지만 빈 설정을 단순하게 유지할 수 있습니다.

OXM 기술을 지정하고 그에 따른 설정이 필요한 언마샬러 빈은 따로 필요한 것이고, 그 외의 SqlService 와 OXM 언마샬러를 사용하는 SqlReader 그리고 SqlRegistry 는 하나의 빈을 등록하는 것으로 충분하기 때문입니다.

SqlRegistry 는 필요에 따라 다른 구현으로 교체할 수도 있습니다.

```xml title="test-applicationContext.xml"
<?xml version="1.0" encoding="UTF-8"?>
<beans ... >
            
  <!-- sql service -->
  <bean id="sqlService" class="springbook.user.sqlservice.OxmSqlService">
    <property name="unmarshaller" ref="unmarshaller" /> 
  </bean>
    
  <bean id="unmarshaller" class="org.springframework.oxm.jaxb.Jaxb2Marshaller">
    <property name="contextPath" value="springbook.user.sqlservice.jaxb" />
  </bean>
  
  // ...

</beans>
```

추상화된 OXM 적용이라는 큰 기술적 변화가 있었지만 설정은 여전히 이해하기 좋습니다.

#### 위임을 이용한 BaseSqlService의 재사용

OxmSqlService 의 SqlReader 를 스태틱 멤버 클래스로 고정했기 때문에 설정이 간결해지고, 의도되지 않은 방식으로 확장될 위험이 없어졌습니다.

하지만 OxmSqlService 와 BaseSqlService 의 loadSql(), getSql() 메소드가 중복된다는 점이 신경쓰입니다.

loadSql(), getSql() 의 구현 로직을 BaseSqlService 에 두고 OxmSqlService 는 설정이나 구성을 변경해주기 위한 어댑터 개념으로 BaseSqlService 앞에 두는 설계가 가능합니다.

OxmSqlService 의 외형적인 틀은 유지한 채로 SqlService 의 기능 구현은 BaseSqlService 로 위임하는 것입니다.

프록시를 만들 때 위임구조를 만들어 보았습니다.

위임을 위해서는 두 개의 빈을 등록하고 클라이언트 요청을 직접 받는 빈이 주요한 내용은 뒤의 빈에게 전달해주는 구조로 만들어야 합니다.

하지만 OxmSqlService 와 BaseSqlService 를 위임구조로 만들기 위해 두 개의 빈을 등록하는 것은 불편합니다.

그래서 DI 를 포기하고 OxmSqlService 와 BaseSqlService 를 한 클래스로 묶어 봅니다.

<Image img={require('./07-9.png')} />

OxmSqlService 는 OXM 기술에 특화된 SqlReader 를 내장하고 있습니다.

실제 SqlReader 와 SqlService 를 이용해 SqlService 의 기능을 구현하는 일은 내부에 BaseSqlService 를 만들어서 위임합니다.

```java title="OxmSqlService.java"
public class OxmSqlService implements SqlService {
  
  // highlight-next-line
  private final BaseSqlService baseSqlService = new BaseSqlService();
  
  // ...
  
  @PostConstruct
  public void loadSql() {
    // highlight-start
    this.baseSqlService.setSqlReader(this.oxmSqlReader);
    this.baseSqlService.setSqlRegistry(this.sqlRegistry);
    
    this.baseSqlService.loadSql();
    // highlight-end
  }

  public String getSql(String key) throws SqlRetrievalFailureException {
    // highlight-next-line
    return this.baseSqlService.getSql(key);
  }
  
}
```

위임구조를 이용하면 OxmSqlService 에 있던 중복 코드를 깔끔하게 제거할 수 있습니다.

SqlReader 와 SqlRegistry 를 활용해 SqlService 를 제공하는 코드는 BaseSqlService 에만 존재합니다.

### 7.3.3 리소스추상화

자바에는 다양한 위치에 존재하는 리소스에 대해 단일화된 접근 인터페이스를 제공해주는 클래스가 없습니다.

그나마 URL 을 이용해 웹상의 리소스에 접근 할 때 사용할 수 있는 java.net.URL 클래스가 있습니다.

현재의 코드는 리소스의 위치와 종류에 따라서 다른 클래스와 메소드를 사용해야 합니다.

이런 경우는 목적은 동일하지만 사용법이 각기 다른 여러 가지 기술이 존재하기 때문에 서비스 추상화를 고민해 볼 수 있습니다.

#### 리소스

스프링은 자바의 리소스 접근 API 를 추강화해서 Resource 라는 추상화 인터페이스를 정의했다.

스프링의 거의 모든 API 는 외부의 리소스 정보가 필요할 때 항상 이 Resource 추상화를 이용합니다.

Resource 는 스프링에서 빈이 아니라 값으로 취급되기 때문에 추상화 적용 방법이 고민됩니다.

빈으로 등록된다면 리소스 타입에 따라 각기 다른 Resource 인터페이스의 구현 클래스를 지정해주면 됩니다.

하지만 Resource 는 값으로 취급되기 때문에 가능한 방법은 `<property>` 의 value 애트리뷰트에 넣는 방법밖에 없습니다.

#### 리소스 로더

스프링에는 URL 클래스와 유사하게 접두어를 이용해 Resource 오브젝트를 선언하는 방법이 있습니다.

문자열안에 리소스의 종류와 위치를 표현하게 합니다.

그리고 문자열로 정의된 리소스를 실제 Resource 타입 오브젝트로 변환해주는 ResourceLoader 를 제공합니다.

```java title="Resourceloader.java"
public interface ResourceLoader {

  Resource getResource(String location);
  
}
```

ResourceLoader 의 대표적인 예는 스프링의 애플리케이션 컨텍스트입니다.

애플리케이션 컨텍스트가 구현해야 하는 인터페이스인 ApplicationContext 는 ResourceLoader 인터페이스를 상속하고 있습니다.

애플리케이션 컨텍스트가 사용할 스프링 설정정보가 담긴 XML 파일도 리소스 로더를 이용해 Resource 형태로 읽어옵니다.

빈의 프로퍼티 값을 변환할 때도 리소스 로더가 자주 사용됩니다.

빈으로 등록 가능한 클래스에 파일을 지정해주는 프로퍼티가 존재한다면 거의 모두 Resource 타입입니다.

Resource 타입은 빈으로 등록하지 않고 `<property>` 태그의 value 를 사용해 문자열로 값을 넣는데, 이 때 문자열인 리소스 정보를 Resource 오브젝트로 변환해서 프로퍼티에 주입할 때도 애플리케이션 컨텍스트 자신이 리소스 로더로서 변환과 로딩 기능을 담당합니다.

만약 myFile 이라는 이름의 프로퍼티가 Resource 타입이라고 하면 다음과 같은 문자열로 리소스를 표현할 수 있습니다.

```xml
<property name="myFile" value="classpath:com/epril/myproject/myfile.txt" />
<property name="myFile" value="file:/data/myfile.txt" />
<property name="myFile" value="http://www.myserver.com/test.dat" />
```

myFile 프로퍼티 입장에서는 추상화된 Resource 타입의 오브젝트를 전달받기 때문에 리소스의 실제 위치나 종류에 관계없이 동일한 방버으로 리소스의 내용을 읽어올 수 있습니다.

#### Resource를 이용해 XML 파일 가져오기

OxmSqlService 에 Resource 를 적용해서 SQL 매핑정보가 담긴 파일을 가져올 수 있게 합니다.

스트링으로 되어 있던 sqlmapFile 프로퍼티를 Resource 타입으로 바꿉니다.

Resource 타입은 실제 소스가 어떤 것이든 상관없이 getInputStream() 메소드를 이용해 스트림으로 가져올 수 있습니다.

Resource 을 사용할 때는 Resource 오브젝트가 실제 리소스가 아니라는 점을 알아야 합니다.

## 7.4 인터페이스 상속을 통한 안전한 기능확장

서버가 운영 중인 상태에서 서버를 재시작하지 않고 긴급하게 애플리케이션이 사용 중인 SQL 을 변경해야 할 수도 있습니다.

지금까지의 SqlService 구현 클래스는 SQL 정보를 초기에 읽어서 메모리에 두고 사용합니다.

SQL 정보를 실시간 반영하는 기능을 통해 기존에 설계하고 개발했던 기능이 발전되어야 할 경우, 스프링답게 접근하는 방법이 무엇인지 알아봅니다.

### 7.4.1 DI와 기능의 확장

지금까지 적용해왔던 DI 는 특별한 기술이라기보다 일종의 디자인 패턴 또는 프로그래밍 모델이라는 관점으로 이해됩니다.

DI 의 가치를 제대로 얻으려면 먼저 DI 에 적합한 오브젝스 설계가 필요합니다.

#### DI를 의식하는 설계

초기부터 SqlService 의 내부 기능을 적절한 책임과 역할에 따라 분리하고, 인터페이스를 정의해 느슨하게 연결해주고, DI 를 통해 유연하게 의존관계를 지정하도록 설계하였기 때문에 그 뒤의 작업이 매우 쉬워졌습니다.

결국 유연하고 확장 가능한 좋은 오브젝트 설계와 DI 프로그래밍 모델은 서로 상승작용을 합니다.

객체지향 설계를 잘하는 방법은 다양하겠지만, 그 중에서 추천하고 싶은 한가지가 있다면 바로 DI 를 의식하면서 설계하는 방식입니다.

DI 를 적용하려면 적절한 책임에 따라 분리된 오브젝트가 서로 의존관계를 가지고 협력하는 구조가 필요합니다.

또한 DI 는 런타임 시에 의존 오브젝트를 다이내믹하게 연결해줘서 유연한 확장을 꾀하는 것이 목적입니다.

따라서 항상 확장에 염두를 두고 오브젝트 관계를 생각해야 합니다.

확장은 항상 미래에 일어납니다.

DI 란 결국 미래를 프로그래밍하는 것입니다.

#### DI와 인터페이스 프로그래밍

DI 를 적용할 때는 가능한 인터페이스를 사용해야 합니다.

인터페이스를 사용하는 첫 번째 이유는 다형성을 얻기 위해서입니다.

하나의 인터페이스를 통해 여러 개의 구현을 바꿔가면서 사용할 수 있게 하는 것이 DI 가 추구하는 첫 번째 목적입니다.

인터페이스를 사용하는 다른 이유는 인터페이스 분리 원칙을 통해 클라이언트와 의존 오브젝트 사이의 관계를 명확하게 해줄 수 있기 때문입니다.

A 가 B 의 인터페이스를 사용한다는 말은 A 가 B 를 바라볼 때 해당 인터페이스라는 창을 통해서 본다는 뜻입니다.

인터페이스는 하나의 오브젝트가 여러 개를 구현할 수 있기 때문에 하나의 오브젝트를 바라보는 창이 여러 개일 수 있습니다.

오브젝트가 그 자체로 충분히 응집도가 높은 작은 단위로 설계되었더라도, 목적과 관심이 각기 다른 클라이언트가 있다면 인터페이스를 통해 이를 적절하게 분리해주어야 합니다.

이를 객체지향 설계 원칙에서는 인터페이스 분리 원칙 Interface Segregation Principle 이라고 합니다.

DI 는 특별한 이유가 없는 한 항상 인터페이스를 사용한다고 생각해야 합니다.

단지 인터페이스를 추가하기 귀찮아서 약간의 게으름을 부리고자 인터페이스를 생략했다면 이후의 개발, 디버깅, 테스트, 기능의 추가, 변화 등에서 적지 않은 부담을 안게 될 것입니다.

### 7.4.2 인터페이스상속

하나의 오브젝트가 여러 개의 인터페이스를 만드는 이유 중의 하나는 오브젝트에게 다른 종류의 클라이언트가 등장하기 때문입니다.

인터페이스 분리 원칙이 주는 장점은 모든 클라이언트가 자신의 관심에 따른 접근 방식을 불필요한 간섭없이 유지할 수 있다는 점입니다.

BaseSqlService 와 그 서브클래스는 SqlReader 와 SqlRegistry 라는 두 개의 인터페이스를 통해 의존 오브젝트들을 DI 하도록 되어 있습니다.

SqlRegistry 의 구현클래스인 MySqlRegistry 의 오브젝트는 SqlRegistry 인터페이스 외에 또 다른 클라이언트를 위한 인터페이스를 가질 수 있습니다.

BaseSqlService 는 이 SqlRegistry 인터페이스를 구현하는 오브젝트에 의존하고 있습니다.

여기에 이미 등록된 SQL 을 변경할 수 있는 기능을 넣어서 확장하고 싶다고 생각해 봅니다.

기존의 SqlRegistry 인터페이스를 이용하는 클라이언트가 있기 때문에 SqlRegistry 인터페이스 자체를 수정하는 것은 바람직한 방법이 아닙니다.

클라이언트의 목적과 용도에 적합한 인터페이스만을 제공한다는 인터페이스 분리 원칙을 지키기 위해서라도 새로운 기능을 위해 이미 적용한 SqlRegistry 를 건드리는 것은 안됩니다.

이런 경우에는 추가할 기능을 이용하는 클라이언트를 위한 새로운 인터페이스를 정의하거나 기존 인터페이스를 확장해야 합니다.

새로운 클라이언트가 필요로 하는 인터페이스는 SQL 에 대한 수정을 요청할 수 있는 메소드를 갖고 있어야 합니다.

그리고 SQL 등록 및 검색 같은 기능이 있는 기존의 SqlRegistry 인터페이스에 정의된 메소드도 사용할 수 있어야 합니다.

따라서 기존의 SqlRegistry 인터페이스를 상속하고 메소드를 추가한 새로운 인터페이스를 정의해야 합니다.

```java title="UpdatableSqlRegistry.java"
// highlight-next-line
public interface UpdatableSqlRegistry extends SqlRegistry {

  public void updateSql(String key, String sql) throws SqlUpdateFailureException;
  public void updateSql(Map<String, String> sqlmap) throws SqlUpdateFailureException;
  
}
```

SQL 업데이트 작업이 필요한 새로운 클라이언트는 UpdatableSqlRegistry 인터페이스를 통해 SQL 레지스트리 오브젝트에 접근하도록 합니다.

새로운 클라이언트의 이름은 SqlAdminService 이라고 합니다.

<Image img={require('./07-11.png')} />

UpdatableSqlRegistry 오브젝트는 BaseSqlService 와 SqlAdminService 에 DI 됩니다.

BaseSqlService 와 SqlAdminService 는 동일한 오브젝트에 의존하고 있지만 각자의 관심과 필요에 따라서 다른 인터페이스를 통해 접근합니다.

클라이언트가 정말 필요한 기능을 가진 인터페이스를 통해 오브젝트에 접근하도록 만들었는지가 중요합니다.

잘 적용된 DI 는 결국 잘 설계된 오브젝트 의존관계에 달려 있습니다.

이렇게 DI 와 객체지향 설계는 서로 밀접한 관계를 맺고 있습니다.

## 7.5 DI를 이용해 다양한 구현 방법 적용하기

운영 중인 시스템에서 사용하는 정보를 실시간으로 변경하는 작업을 만들 때 동시성 문제가 가장 먼저 고려되어야 합니다.

SqlRegistry 가 읽기전용으로 동작할 때는 동시성 문제가 발생할 일이 없습니다.

하지만 수정은 문제가 다릅니다.

자바에서 제공되는 주요 기술을 이용해 간단한 방식으로 어느 정도 안전한 업데이트가 가능한 SQL 레지스트리를 구현해보겠습니다.

### 7.5.1 ConcurrentHashMap을 이용한 수정 가능 SQL 레지스트리

HashMap 으로는 멀티스레드 환경에서 동시에 수정을 시도하거나 수정과 동시에 요청하는 경우 예상하지 못한 결과가 발생할 수 있습니다.

멀티스레드 환경에서 안전하게 HashMap 을 조작하려면 Collections.synchronizedMap() 등을 이용해 외부에서 동기화해줘야 합니다.

하지만 이런 방식은 고성능 서비스에서는 성능에 문제가 발생합니다.

따라서 동기화된 해시 데이터 조작에 최적화된 ConcurrentHashMap 을 사용하는 방법이 일반적으로 권장됩니다.

ConcurrentHashMap 은 데이터 조작 시 전체 데이터에 대해 락을 걸지 않고, 조회는 락을 아예 사용하지 않습니다.

#### 수정 가능 SQL 레지스트리 테스트

ConcurrentHashMap 을 이용해 UpdatableSqlRegistry 를 구현해봅니다.

SQL 등록한 것이 잘 조회되는지와, 이를 수정한 후에 수정된 SQL 이 바르게 적용되는지를 확인하는 단위테스트를 만듭니다.

```java title="ConcurrentHashMapSqlRegistryTest.java"
public class ConcurrentHashMapSqlRegistryTest {
  UpdatableSqlRegistry sqlRegistry;
  
  @Before
  public void setUp() {
    sqlRegistry = new ConcurrentHashMapSqlRegistry();
    // 초기 SQL 정보
    // highlight-start
    sqlRegistry.registerSql("KEY1", "SQL1");
    sqlRegistry.registerSql("KEY2", "SQL2");
    sqlRegistry.registerSql("KEY3", "SQL3");
    // highlight-end
  }
  
  @Test
  public void find() {
    checkFindResult("SQL1", "SQL2", "SQL3");
  }

  private void checkFindResult(String expected1, String expected2, String expected3) {
    assertThat(sqlRegistry.findSql("KEY1"), is(expected1));    
    assertThat(sqlRegistry.findSql("KEY2"), is(expected2));    
    assertThat(sqlRegistry.findSql("KEY3"), is(expected3));    
  }
  
  // 예외상황에 대한 테스트는 항상 의식적으로 넣으려고 노력해야 합니다.
  // highlight-start
  @Test(expected= SqlNotFoundException.class)
  public void unknownKey() {
    sqlRegistry.findSql("SQL9999!@#$");
  }
  // highlight-end
      
  
  @Test
  public void updateSingle() {
    sqlRegistry.updateSql("KEY2", "Modified2");    
    checkFindResult("SQL1", "Modified2", "SQL3");
  }
  
  @Test
  public void updateMulti() {
    Map<String, String> sqlmap = new HashMap<String, String>();
    sqlmap.put("KEY1", "Modified1");
    sqlmap.put("KEY3", "Modified3");
    
    sqlRegistry.updateSql(sqlmap);    
    checkFindResult("Modified1", "SQL2", "Modified3");
  }

  @Test(expected=SqlUpdateFailureException.class)
  public void updateWithNotExistingKey() {
    sqlRegistry.updateSql("SQL9999!@#$", "Modified2");
  }
}
```

동시성에 대한 부분을 테스트하면 좋겠지만 간단하지 않기 때문에 일단 수정 기능을 검증하는 테스트만 만듭니다.

코드와 테스트를 만들어 검증하는 간격을 가능한 짧게하고, 예외상황을 포함한 기능을 세세하게 검증하도록 테스트를 만드는 것이 중요합니다.

#### 수정 가능 SQL 레지스트리 구현

ConcurrentHashMapSqlRegistry 를 만들어봅니다.

```java title="ConcurrentHashMapSqlRegistry.java"
public class ConcurrentHashMapSqlRegistry implements UpdatableSqlRegistry {

  // highlight-next-line
  private Map<String, String> sqlMap = new ConcurrentHashMap<String, String>();

  public String findSql(String key) throws SqlNotFoundException {
    String sql = sqlMap.get(key);
    if (sql == null)  throw new SqlNotFoundException(key + "를 이용해서 SQL을 찾을 수 없습니다");
    else return sql;
  }

  public void registerSql(String key, String sql) { sqlMap.put(key, sql);  }

  public void updateSql(String key, String sql) throws SqlUpdateFailureException {
    if (sqlMap.get(key) == null) {
      throw new SqlUpdateFailureException(key + "에 해당하는 SQL을 찾을 수 없습니다");
    }
    
    sqlMap.put(key, sql);
  }

  public void updateSql(Map<String, String> sqlmap) throws SqlUpdateFailureException {
    for(Map.Entry<String, String> entry : sqlmap.entrySet()) {
      updateSql(entry.getKey(), entry.getValue());
    }
  }
  
}
```

OxmSqlService 는 sqlRegistry 를 지정하지 않으면 HashMapSqlRegistry 를 기본으로 사용하도록 되어 있습니다.

OxmSqlService 가 새로 만든 ConcurrentHashMapSqlRegistry 빈을 사용하도록 설정을 변경합니다.

```xml title="test-applicationContext.xml"
<beans xmlns="...">

  <bean id="sqlService" class="springbook.user.sqlservice.OxmSqlService">
    <property name="unmarshaller" ref="unmarshaller" />
    // highlight-next-line
    <property name="sqlRegistry" ref="sqlRegistry" />
  </bean>
  
  // highlight-start
  <bean id="sqlRegistry" class="springbook.user.sqlservice.updatable.ConcurrentHashMapSqlRegistry">
  </bean>
  // highlight-end
  
</beans>
```

ConcurrentHashMapSqlRegistry 와 OxmSqlService 가 서로 협력하여 SqlService 기능을 제공하는데 이상이 없는지 확인할 수 있습니다.

### 7.5.2 내장형 데이터베이스를 이용한 SQL 레지스트리 만들기

이번에는 ConcurrentHashMapSqlRegistry 대신 내장형 DB embedded DB 를 이용해 SQL 을 저장하고 수정하도록 해보겠습니다.

내장형 DB 는 애플리케이션에 내장되어 애플리케이션과 함께 시작되고 종료되는 DB 를 말합니다.

데이터가 메모리에 저장되기 때문에 성능이 뛰어나고, Map 같은 컬렉션, 오브젝트를 이용한 방법에 비해 안정적으로 등록, 수정, 검색이 가능합니다.

또한 락킹, 격리수준, 트랜잭션을 적용할 수도 있습니다.

#### 스프링의 내장형 DB 지원 기능

자바에서 많이 사용되는 내장형 DB 는 Derby, HSQL, H2 를 꼽을 수 있습니다.

내장형 DB 는 애플리케이션 내에서 DB 를 생성하고 테이블을 만드는 초기화 작업이 필요합니다.

스프링에서는 내장형 DB 를 초기화하는 내장형 DB 빌더를 제공합니다.

#### 내장형 DB 빌더 학습 테스트

스프링의 내장형 DB 지원 기능이 동작하는 방법을 보기 위해 학습테스트를 만듭니다.

테이블을 생성하는 schema.sql 과 데이터를 등록하는 data.sql 을 각각 만듭니다.

```text title="schema.sql"
CREATE TABLE SQLMAP (
  KEY_ VARCHAR(100) PRIMARY KEY,
  SQL_ VARCHAR(100) NOT NULL
);
```

```text title="data.sql"
INSERT INTO SQLMAP(KEY_, SQL_) values('KEY1', 'SQL1');
INSERT INTO SQLMAP(KEY_, SQL_) values('KEY2', 'SQL2');
```

이제 테스트를 만들어서 EmbeddedDataBuilder 가 어떻게 동작하는지 확인합니다.

```java title="EmbeddedDbTest.java"
public class EmbeddedDbTest {

  EmbeddedDatabase db;
  SimpleJdbcTemplate template;
  
  @Before
  public void setUp() {
    // highlight-start
    db = new EmbeddedDatabaseBuilder()
      .setType(HSQL)      
      .addScript("classpath:/springbook/learningtest/spring/embeddeddb/schema.sql") 
      .addScript("classpath:/springbook/learningtest/spring/embeddeddb/data.sql")
      .build();
    // highlight-end
    
    template = new SimpleJdbcTemplate(db); 
  }
  
  // highlight-start
  @After
  public void tearDown() {
    db.shutdown();
  }
  // highlight-end
  
  @Test
  public void initData() {
    assertThat(template.queryForInt("select count(*) from sqlmap"), is(2));
    
    List<Map<String,Object>> list = template.queryForList("select * from sqlmap order by key_");
    assertThat((String)list.get(0).get("key_"), is("KEY1"));
    assertThat((String)list.get(0).get("sql_"), is("SQL1"));
    assertThat((String)list.get(1).get("key_"), is("KEY2"));
    assertThat((String)list.get(1).get("sql_"), is("SQL2"));
  }
  
  @Test
  public void insert() {
    template.update("insert into sqlmap(key_, sql_) values(?, ?)", "KEY3", "SQL3");
    
    assertThat(template.queryForInt("select count(*) from sqlmap"), is(3));
  }
  
}
```

#### 내장형 DB를 이용한 SqlRegistry 만들기

학습테스트에서 살펴본 것 처럼 스프링에서 내장형 DB 를 사용하려면 EmbeddedDatabaseBuilder 를 사용하면 됩니다.

EmbeddedDatabaseBuilder 는 초기화 코드가 필요합니다.

초기화 코드가 필요할 때는 팩토리 빈으로 만들어주면 좋습니다.

EmbeddedDatabaseBuilder 를 활용해서 EmbeddedDatabase 타입의 오브젝트를 생성해주는 팩토리 빈을 만들어야 합니다.

스프링에는 팩토리 빈을 만드는 작업을 대신해주는 전용 태그가 있습니다.

```xml title="test-applicationContext.xml"
<beans xmlns="..." >

  // ...
  
  <bean id="sqlRegistry" class="springbook.user.sqlservice.updatable.EmbeddedDbSqlRegistry">
    // highlight-next-line
    <property name="dataSource" ref="embeddedDatabase" />
  </bean>
  
  // highlight-start
  <jdbc:embedded-database id="embeddedDatabase" type="HSQL">
    <jdbc:script location="classpath:schema.sql"/>
  </jdbc:embedded-database>
  // highlight-end
  
  // ...
</beans>
```

EmbeddedDatabase 타입의 embeddedDatabase 아이디를 가진 빈이 등록됩니다.

```java title="EmbeddedDbSqlRegistry.java"
public class EmbeddedDbSqlRegistry implements UpdatableSqlRegistry {

  SimpleJdbcTemplate jdbc;
  
  // highlight-start
  public void setDataSource(DataSource dataSource) {
    jdbc = new SimpleJdbcTemplate(dataSource);
  }
  // highlight-end
  
  // ...
}
```

내장형 DB 를 사용하기 위해서 DataSource 타입의 오브젝트를 주입받은 수정자 부분을 봅니다.

정의한 빈의 타입은 EmbeddedDatabase 타입인데, DataSource 타입으로 DI 받고 있습니다.

물론 EmbeddedDatabase 인터페이스는 DataSource 를 상속한 인터페이스입니다.

클라이언트가 자신이 필요로 하는 기능을 가진 인터페이스를 통해 의존 오브젝트를 DI 하는 것이 가장 바람직합니다. 

따라서 DB 종료기능을 가진 EmbeddedDatabase 대신 DataSource 을 사용한 것입니다. 

#### UpdatableSqlRegistry 테스트 코드의 재사용

ConcurrentHashMapSqlRegistry 와 EmbeddedDbSqlRegistry 둘 다 UpdatableSqlRegistry 인터페이스를 구현하고 있습니다.

인터페이스가 같은 구현클래스라고 하더라도 구현 방식에 따라 검증 내용이나 테스트 방법이 달라질 수 있고, 의존 오브젝트의 구성에 따라 목이나 스텁을 이용하기도 합니다.

하지만 DAO 는 DB 까지 연동하는 테스트를 하는 편이 효과적이고 DataSource 를 테스트 대역을 쓰기는 어렵습니다.

따라서 ConcurrentHashMapSqlRegistry 와 EmbeddedDbSqlRegistry 둘 다 테스트 방법이 동일할 것으로 보입니다.

기존에 만들었던 ConcurrentHashMapSqlRegistryTest 의 테스트 코드를 EmbeddedDbSqlRegistryTest 에서 공유하는 방법을 찾아 봅니다.

```java title="ConcurrentHashMapSqlRegistryTest.java"
public class ConcurrentHashMapSqlRegistryTest {
  
  UpdatableSqlRegistry sqlRegistry;
  
  @Before
  public void setUp() {
    // highlight-next-line
    sqlRegistry = new ConcurrentHashMapSqlRegistry();
    // ...
  }
  
  // ...
  
}
```

ConcurrentHashMapSqlRegistryTest 를 보면 UpdatableSqlRegistry 구현클래스를 생성하는 부분만 분리하면 나머지 테스트 코드 공유가 가능합니다.

따라서 상속을 통해 테스트 코드를 공유하도록 만듭니다.

```java title="AbstractUpdatableSqlRegistryTest.java"
public abstract class AbstractUpdatableSqlRegistryTest {

  UpdatableSqlRegistry sqlRegistry;
  
  @Before
  public void setUp() {
    // highlight-next-line
    sqlRegistry = createUpdatableSqlRegistry();
  }
  
  abstract protected UpdatableSqlRegistry createUpdatableSqlRegistry();
  
  // 기존의 테스트 코드들
  // ...
  
}
```

추상클래스를 만들고, 상속할 수 있도록 합니다.

UpdatableSqlRegistry 구현클래스는 AbstractUpdatableSqlRegistryTest 를 상속받은 클래스에서 생성하도록 합니다.

```java title="ConcurrentHashMapSqlRegistryTest.java"
public class ConcurrentHashMapSqlRegistryTest extends AbstractUpdatableSqlRegistryTest {

  protected UpdatableSqlRegistry createUpdatableSqlRegistry() {
    // highlight-next-line
    return new ConcurrentHashMapSqlRegistry();
  }
  
}
```

```java title="EmbeddedDbSqlRegistryTest.java"
public class EmbeddedDbSqlRegistryTest extends AbstractUpdatableSqlRegistryTest {
  EmbeddedDatabase db;
  
  @Override
  protected UpdatableSqlRegistry createUpdatableSqlRegistry() {
    // highlight-start
    db = new EmbeddedDatabaseBuilder()
      .setType(HSQL)
      .addScript("classpath:springbook/user/sqlservice/updatable/sqlRegistrySchema.sql")
      .build();
    
    EmbeddedDbSqlRegistry embeddedDbSqlRegistry = new EmbeddedDbSqlRegistry();
    embeddedDbSqlRegistry.setDataSource(db);
    
    return embeddedDbSqlRegistry;
    // highlight-end
  }
  
  @After
  public void tearDown() {
    db.shutdown();
  }
}
```

#### XML 설정을 통한 내장형 DB의 생성과 적용

내장형 DB 를 등록하는 방법은 jdbc 스키마의 전용 태그를 사용하는 것이 편합니다.

```xml title="test-applicationContext.xml"
<beans xmlns="...">
  // ...
  
  <bean id="sqlRegistry" class="springbook.user.sqlservice.updatable.EmbeddedDbSqlRegistry">
    // highlight-next-line
    <property name="dataSource" ref="embeddedDatabase" />
  </bean>
  
  // highlight-next-line
  <jdbc:embedded-database id="embeddedDatabase" type="HSQL">
    <jdbc:script location="classpath:springbook/user/sqlservice/updatable/sqlRegistrySchema.sql"/>
  </jdbc:embedded-database>
  
</beans>
```

`<jdbc:embedded-database>` 태그로 만들어지는 EmbeddedDatabase 타입 빈은 스프링 컨테이너가 종료될 때 자동으로 shutdown() 메소드가 호출되도록 설정되기 때문에 별도의 종료코드가 필요하지 않습니다.

### 7.5.3 트랜잭션 적용

여러 개의 SQL 을 수정하는 작업은 반드시 트랜잭션 안에서 일어나야 합니다.

HashMap 과 같은 컬렉션은 트랜잭션 개념을 적용하기 어렵기 때문에 내장형 DB 를 도입하였습니다.

스프링에서 트랜잭션 적용을 위해 AOP 를 이용하는 것이 편리합니다.

하지만 제한된 오브젝트 내에서의 간단한 트랜잭션의 경우 트랜잭션 추상화 API 를 사용하는 편이 좋습니다.

#### 다중 SQL 수정에 대한 트랜잭션 테스트

트랜잭션이 적용되면 성공하고 아니면 실패하는 테스트를 만듭니다.

```java title="EmbeddedDbSqlRegistryTest.java"
public class EmbeddedDbSqlRegistryTest extends AbstractUpdatableSqlRegistryTest {
  EmbeddedDatabase db;
  
  // ...

  @Test
  public void transactionalUpdate() {
    checkFind("SQL1", "SQL2", "SQL3");
    
    Map<String, String> sqlmap = new HashMap<String, String>();
    sqlmap.put("KEY1", "Modified1");
    // highlight-next-line
    sqlmap.put("KEY9999!@#$", "Modified9999");
    
    try {
       // highlight-next-line
      sqlRegistry.updateSql(sqlmap);
      fail();
    }
    catch(SqlUpdateFailureException e) {}
    
    checkFind("SQL1", "SQL2", "SQL3");
  }

}
```

'KEY9999!@#$' 라는 존재하지 않는 키를 지정했기 때문에 테스트는 실패합니다.

실패한 경우 'KEY1' 에 적용된 'Modified1' 이 롤백되어야 하지만 롤백되지 않았기 때문입니다.

#### 코드를 이용한 트랜잭션 적용

코드에 TransactionTemplate 을 사용하여 트랜잭션을 적용하도록 합니다.

```java title="EmbeddedDbSqlRegistry.java"
public class EmbeddedDbSqlRegistry implements UpdatableSqlRegistry {

  SimpleJdbcTemplate jdbc;
  // highlight-next-line
  TransactionTemplate transactionTemplate;
  
  public void setDataSource(DataSource dataSource) {
    jdbc = new SimpleJdbcTemplate(dataSource);
    // highlight-start
    transactionTemplate = new TransactionTemplate(
        new DataSourceTransactionManager(dataSource));
    // highlight-end
  }
  
  // ...

  public void updateSql(final Map<String, String> sqlmap) throws SqlUpdateFailureException {
    transactionTemplate.execute(new TransactionCallbackWithoutResult() {
      protected void doInTransactionWithoutResult(TransactionStatus status) {
        // highlight-start
        for(Map.Entry<String, String> entry : sqlmap.entrySet()) {
          updateSql(entry.getKey(), entry.getValue());
        }
        // highlight-end
      }
    });
  }
  
}
```

트랜잭션으로 동작할 코드를 콜백 형태로 전달하여 수행합니다.

## 7.6 스프링 3.1의 DI

스프링이 처음 등장한 이후 많은 변화를 겪은 것은 사실이지만 스프링이 근본적으로 지지하는 객체지향 언어인 자바의 특징과 장점을 극대화하는 프로그래밍 스타일과 이를 지원하는 도구로서의 스프링 정체성은 변하지 않았습니다.

#### 자바 언어의 변화와 스프링

DI 가 적용된 코드를 작성할 때 사용되는 자바 언어가 그간 많은 변화가 있어서 스프링의 사용 방식에도 영향을 줬습니다.

- 애노테이션의 메타정보 활용

자바 코드의 메타정보를 이용한 프로그래밍 방식입니다.

자바 코드는 실행되는 것이 아니라 다른 자바 코드에 의해 데이터처럼 취급되기도 합니다.

자바 코드의 일부를 리플렉션 API 등을 이용해 어떻게 만들었는지 살펴보고 그에 때라 구현하는 방식입니다.

원래 리플렉션 API 는 자바 코드나 컴포넌트를 작성하는 데 사용되는 툴을 개발할 때 이용하도록 만들어졌습니다.

그러다가 점점 자바 코드의 메타정보를 데이터로 활용하는 스타일의 프로그래밍 방식에 활용되기 시작했습니다.

이 방식은 애노테이션이 등장하면서 본격화되기 시작했습니다.

애노테이션은 리플렉션 API 를 이용해 애노테이션의 메타정보를 조회하여 설정된 값을 가져와 참고하는 방식으로 사용됩니다.

애노테이션은 프레임워크가 참조하는 메타정보로 활용되기에 유리한 점이 많았기 때문에 활용이 늘어났습니다.

객체지향 프로그래밍을 적용하면 핵심 로직을 담은 오브젝트가 클라이언트에 의해 생성되고, 관계를 맺고 제어되는 구조가 됩니다.

이 때 클라이언트는 일종의 IoC 프레임워크로 동작하고, 팩토리는 IoC 프레임워크가 참조하는 메타정보가 됩니다.

메타정보를 편하게 작성하기 위해서 스프링 초창기부터 XML 이 프레임워크가 사용하는 DI 메타정보로 적극 활용되었습니다.

애노테이션이 등장하면서 XML 같은 외부 파일이 아닌 자바 코드의 일부로 메타정보를 사용할 수 있는 방식이 가능해졌습니다.

애노테이션은 정의하기에 따라 타입, 필트, 메소드, 파라미터, 생성자, 로컬 변수에 적용이 가능합니다.

그리고 애노테이션을 통해 다양한 부가 정보를 얻어낼 수 있습니다.

XML 과 다르게 애노테이션은 자바 코드에 존재하므로 변경할 때마다 컴파일하는 단점이 있습니다.

- 정책과 관례를 이용한 프로그래밍

애노테이션 같은 메타정보를 활용하는 방식은 명시적인 방식에서 관례적인 방식으로 프로그래밍 스타일을 변화시켜 왔습니다.

이런 스타일의 장점은 모든 작업을 표현하는 것에 비해 작성할 내용이 줄어든다는 것입니다.

스프링은 애노테이션으로 메타정보를 작성하고, 관례를 활용해서 간결한 코드에 많은 내용을 담을 수 있도록 하고 있습니다.

이제 최신 DI 스타일로 변경하는 과정을 보여주고 설명합니다.

### 7.6.1 자바코드를 이용한 빈설정

먼저 XML 을 없애는 작업을 합니다.

지금까지 만든 XML 설정은 테스트용 DI 설정입니다.

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


