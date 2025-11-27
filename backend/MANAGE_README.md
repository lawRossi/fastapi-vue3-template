# 后端服务管理脚本使用指南

`manage.py` 是后端项目的服务管理脚本，提供数据库迁移、服务启动、测试运行等常用功能。

## 快速开始

### 给脚本添加执行权限
```bash
chmod +x backend/manage.py
```

### 查看帮助信息
```bash
python backend/manage.py --help
```

## 功能说明

### 1. 数据库管理 (db)

#### 初始化数据库迁移环境
```bash
python backend/manage.py db init
```

#### 创建新的数据库迁移
```bash
# 自动生成迁移文件
python backend/manage.py db create "添加用户表"

# 手动编辑迁移文件后升级
python backend/manage.py db upgrade
```

#### 数据库版本控制
```bash
# 查看迁移历史
python backend/manage.py db history

# 查看当前数据库版本
python backend/manage.py db current

# 升级到最新版本
python backend/manage.py db upgrade

# 降级到上一个版本
python backend/manage.py db downgrade

# 升级到指定版本
python backend/manage.py db upgrade_to <revision_id>

# 降级到指定版本
python backend/manage.py db downgrade_to <revision_id>
```

### 2. 服务管理 (server)

#### 开发环境启动
```bash
# 启动开发服务器 (开启热重载)
python backend/manage.py server dev
# 或者
python backend/manage.py server start --host 127.0.0.1 --port 8000
```

#### 生产环境启动
```bash
# 启动生产服务器 (关闭热重载)
python backend/manage.py server prod
# 或者
python backend/manage.py server start --host 0.0.0.0 --port 8000 --no-reload
```

#### 自定义启动参数
```bash
# 指定主机和端口
python backend/manage.py server start --host 0.0.0.0 --port 3000

# 禁用热重载
python backend/manage.py server start --no-reload
```

### 3. 测试管理 (test)

#### 运行所有测试
```bash
python backend/manage.py test run
```

#### 运行特定测试文件
```bash
python backend/manage.py test run app/tests/test_user.py
```

#### 运行特定测试目录
```bash
python backend/manage.py test run app/tests/
```

### 4. 工具管理 (util)

#### 检查项目依赖
```bash
python backend/manage.py util check
```

#### 清理缓存文件
```bash
python backend/manage.py util clean
```

## 环境变量配置

脚本支持以下环境变量：

```bash
# 服务配置
export HOST="127.0.0.1"          # 服务主机地址
export PORT="8000"               # 服务端口
export RELOAD="true"             # 是否开启热重载

# 数据库配置
# 修改 alembic.ini 文件中的 sqlalchemy.url
sqlalchemy.url = sqlite:///./dev.db
# 或者使用环境变量
export DATABASE_URL="sqlite:///./dev.db"

# JWT 配置
export JWT_SECRET="your-secret-key"  # JWT 密钥
```

## 常用工作流

### 1. 新项目初始化
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 初始化数据库
python backend/manage.py db init

# 3. 创建初始迁移
python backend/manage.py db create "初始化数据库"

# 4. 升级数据库
python backend/manage.py db upgrade

# 5. 启动开发服务器
python backend/manage.py server dev
```

### 2. 开发新功能
```bash
# 1. 修改模型后创建迁移
python backend/manage.py db create "添加新字段"

# 2. 升级数据库
python backend/manage.py db upgrade

# 3. 运行测试
python backend/manage.py test run

# 4. 启动服务测试
python backend/manage.py server dev
```

### 3. 数据库版本回退
```bash
# 查看历史
python backend/manage.py db history

# 回退到上一个版本
python backend/manage.py db downgrade

# 回退到指定版本
python backend/manage.py db downgrade_to <revision_id>
```

### 4. 生产部署
```bash
# 1. 清理开发缓存
python backend/manage.py util clean

# 2. 运行测试确保质量
python backend/manage.py test run

# 3. 升级数据库到最新版本
python backend/manage.py db upgrade

# 4. 启动生产服务器
python backend/manage.py server prod
```

## 故障排除

### 常见问题

1. **权限错误**
   ```bash
   chmod +x backend/manage.py
   ```

2. **依赖缺失**
   ```bash
   python backend/manage.py util check
   pip install -r requirements.txt
   ```

3. **端口占用**
   ```bash
   # 使用不同端口启动
   python backend/manage.py server start --port 8001
   ```

4. **数据库锁定**
   ```bash
   # 检查当前版本
   python backend/manage.py db current
   
   # 重置数据库（慎用！）
   rm dev.db
   python backend/manage.py db upgrade
   ```

### 日志查看
脚本会输出详细的执行日志，包含时间戳和操作信息。如果遇到问题，请查看完整的错误信息。

## 自定义扩展

如需添加新的管理功能，可以：

1. 在 `manage.py` 中添加新的 Manager 类
2. 在 `main()` 函数中添加相应的命令解析
3. 在相应的子解析器中添加新的子命令

示例：
```python
# 添加新的管理器类
class CustomManager:
    def custom_command(self):
        logger.info("执行自定义命令")
        # 你的自定义逻辑

# 在 main() 中添加
elif args.command == "custom":
    custom_manager = CustomManager()
    custom_manager.custom_command()
```

---

通过 `manage.py` 脚本，你可以高效地管理后端项目的各个生命周期阶段，从开发到部署都有相应的命令支持。