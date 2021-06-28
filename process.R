library(tidyverse)

# TECNOLOGIA PARA COMBATER COVID-19 POR MUNICÍPIO
# Gráfico 01
data1 <- data1_raw %>% 
  select(name = "Cidade", parent = "UF", value = "Nº de produtos")

summary1 <- data1 %>% 
  group_by(data1$parent) %>% 
  summarise(value = sum(value)) %>% 
  mutate(parent = "Brasil") %>% 
  select(name = "data1$parent", parent, value)

data1_finish <- data1 %>% 
  union(summary1) %>% 
  arrange(parent, name)

write_csv(data1_finish, paste0(here::here(), "/data1.csv"))


# FUNÇÕES DE PRODUTOS POR ESTADO E FORNECEDOR
# Gráfico 02
data2 <- data2_raw %>% 
  select(name = "Função do produto", parent = "UF", value = "Quantidade deste produto na UF") %>% 
  mutate(name = paste0(name, " ", parent))

summary2 <- data2 %>% 
  group_by(data2$parent) %>% 
  summarise(value = sum(value)) %>% 
  mutate(parent = "Brasil") %>% 
  select(name = "data2$parent", parent, value)

data2_finish <- data2 %>% 
  union(summary2) %>% 
  arrange(parent, name)

write_csv(data2_finish, paste0(here::here(), "/sunbrust/data2.csv"))


# FUNÇÕES DE PRODUTOS POR MUNICÍPIO E FORNECEDOR
# Gráfico 03
data3A <- data3_raw %>%
  select(source = "Cidade", target = "Nome do fornecedor serviço", value = "Quantidade deste produto na UF", uf = "UF", regiao = "Região") %>% 
  group_by(target) %>% 
  mutate(count = n(), tipo = "regiao", funcao = "") %>% 
  arrange(regiao, desc(count))

#data3B <- data3_raw %>%
#  select(source = "Nome do fornecedor serviço", target = "Função do produto", value = "Quantidade deste produto na UF", uf = "UF", regiao = "Região") %>% 
#  group_by(target) %>% 
#  mutate(count = n()) %>%  
#  arrange(desc(count))
data3B <- data3_raw %>%
  select(source = "Nome do fornecedor serviço", target = "Função do produto", value = "Quantidade deste produto na UF", uf = "UF", regiao = "Região") %>% 
  group_by(source, target) %>% 
  summarise(value = sum(value)) %>% 
  mutate(count = value, uf = "", regiao = "", tipo = "funcao", funcao = target) %>% 
  arrange(regiao, desc(count))
  
data3_finish <- data3A %>% 
  union(data3B)

write_csv(data3_finish, paste0(here::here(), "/sankey/data3.csv"))
