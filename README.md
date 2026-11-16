# Projeto Integrador Transdisciplinar II - Sistema de Gestão de E-Commerce

Aplicação full-stack desenvolvida para o Projeto Integrador Transdisciplinar II, voltada para o gerenciamento completo de um comércio eletrônico. O projeto conta com arquitetura limpa em camadas, persistência com Spring Data JPA e PostgreSQL, além de uma interface web moderna e responsiva integrada.

Acesse a aplicação em funcionamento: [https://store-pro-faculdade.5tsotr.easypanel.host/](https://store-pro-faculdade.5tsotr.easypanel.host/)

---

## 🚀 Tecnologias Utilizadas

### Backend
* **Java 21**
* **Spring Boot 3.x**
* **Spring Data JPA / Hibernate**
* **PostgreSQL** (Banco de dados relacional)
* **H2 Database** (Ambiente de testes automatizados)
* **Maven** (Gerenciamento de dependências)
* **JUnit 5 & Mockito** (Testes unitários)

### Frontend
* **HTML5 & JavaScript (ES6+)**
* **Tailwind CSS** (Design responsivo e moderno)

---

## 🏛️ Arquitetura e Padrões de Projeto

* **DTOs com Java `record`**: Transferência de dados imutável, segura e concisa.
* **Mappers dedicados**: Desacoplamento estrito entre Entidades de Domínio e DTOs.
* **Tratamento Global de Exceções**: Uso de `@ControllerAdvice` para padronização de erros (`ResourceNotFoundException`, violações de integridade).
* **Cascade & OrphanRemoval**: Gerenciamento automático do ciclo de vida dos itens de pedidos (`Order` / `OrderItem`) para evitar erros de chave estrangeira no PostgreSQL.

---

## ⚙️ Principais Funcionalidades

1. **Gestão de Clientes (Users)**:
    * Cadastro, edição, listagem e exclusão de clientes.
    * Validação de unicidade de e-mail e restrição de integridade (impede exclusão caso existam pedidos vinculados).
2. **Gestão de Produtos e Categorias**:
    * CRUD completo de produtos associados a múltiplas categorias.
    * Contagem dinâmica de produtos por categoria.
3. **Gestão de Pedidos (Orders)**:
    * Criação de pedidos com seleção de cliente e múltiplos itens (produto e quantidade).
    * Geração automática do instante do pedido (`Instant.now()`) no backend e status inicial (`WAITING_PAYMENT`).
    * Cálculo automático de subtotais e valor total via mapper e entidade.
    * Ciclo de vida de status traduzido e atualizável via interface (*Aguardando Pagamento*, *Pago*, *Enviado*, *Entregue*, *Cancelado*).
4. **Dashboard Gerencial**:
    * Métricas de faturamento total, pedidos pendentes, produtos e clientes ativos.
    * Listagem dos últimos pedidos e distribuição de produtos por categoria.

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
* **JDK 21** instalado
* **Maven** instalado
* **PostgreSQL** configurado

### 1. Clonar o Repositório
```bash
git clone https://github.com/DaviBrazz/projeto-integrador-transdisciplinar-II-faculdade.git
cd projeto-integrador-transdisciplinar-II-faculdade
```

### 2. Configurar o Banco de Dados (`application.yml`)
No arquivo `src/main/resources/application.yml`, configure suas credenciais do PostgreSQL:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/sua_base
    username: seu_usuario
    password: sua_senha
```

### 3. Executar a Aplicação
```bash
mvn spring-boot:run
```
O servidor estará rodando em `http://localhost:8080`.

---

## 🧪 Testes Automatizados

Para executar os testes unitários utilizando o perfil de teste (`application-test.yml` com banco H2 em memória):
```bash
mvn test
```

---

## 👥 Autor
Desenvolvido por **Davi Braz** para o Projeto Integrador Transdisciplinar II.