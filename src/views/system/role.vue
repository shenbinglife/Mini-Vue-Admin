<template>

  <el-space direction="vertical" :fill="true" style="width: 100%">
    <div></div>
    <el-form ref="queryRef" :model="queryParams" :inline="true" class="fix-form-inline">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="queryParams.roleName"
                  placeholder="请输入角色名称"
                  clearable
                  @keyup.enter.native="handleQuery"/>
      </el-form-item>

      <el-form-item label="角色键名" prop="roleKey">
        <el-input v-model="queryParams.roleKey"
                  placeholder="请输入角色键名"
                  clearable
                  @keyup.enter.native="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery(queryRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </el-col>

      <el-col :span="1.5">
        <el-button type="success" @click="handleUpdate">修改</el-button>
      </el-col>

      <el-col :span="1.5">
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </el-col>


    </el-row>

    <el-table ref="tableRef" :data="tableData.list" style="width: 100%;" :border="true">
      <el-table-column type="selection"></el-table-column>
      <el-table-column fixed prop="id" label="id"/>
      <el-table-column prop="roleName" label="角色名"/>
      <el-table-column prop="roleKey" label="角色键名"/>
      <el-table-column prop="remark" label="备注"/>
      <el-table-column prop="orderNum" label="显示排序"/>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <MiDictLabel :dictValue="scope.row.status" dictType="common.status"/>
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="操作">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleUpdate(scope.row.id)">修改</el-button>
          <el-button link type="primary" size="small" @click="handleMember(scope.row.id)">用户</el-button>
          <el-button link type="primary" size="small" @click="handlePermission(scope.row.id)">权限</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display: flex; align-items: center; justify-content: flex-end; ">
      <span>总条数: {{ tableData.total }}</span>
      <el-pagination background layout="->, prev, pager, next, sizes"
                     :total="tableData.total"
                     v-model:page-size="queryParams.pageSize"
                     v-model:current-page="queryParams.pageIndex"
                     :page-sizes="[10, 20, 50, 100]"
                     @change="handleQuery"
                     style="padding-top: 5px"/>
    </div>
  </el-space>

  <el-dialog :title="formDialog.title" v-model="formDialog.open" width="500px" append-to-body
             :close-on-click-modal="false">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称"/>
      </el-form-item>
      <el-form-item label="角色键名" prop="roleKey">
        <el-input v-model="formData.roleKey" placeholder="请输入角色键名"/>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注"/>
      </el-form-item>
      <el-form-item label="显示排序" prop="orderNum">
        <el-input v-model="formData.orderNum" type="number" placeholder="请输入显示排序"/>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch v-model="formData.status" placeholder="请选择状态"
                   active-text="启用"
                   inactive-text="停用" inline-prompt active-value="0" inactive-value="1"/>
      </el-form-item>
    </el-form>
    <template #footer class="dialog-footer">
      <el-button type="primary" @click="submitForm(formRef)">确 定</el-button>
      <el-button @click="cancelForm">取 消</el-button>
    </template>
  </el-dialog>

  <el-dialog append-to-body title="配置角色权限" v-model="permDialog.open" width="500px" :close-on-click-modal="false">
    <el-checkbox v-model="treeExpand" @change="handleTreeExpand">展开/折叠</el-checkbox>
    <el-checkbox v-model="treeNodeAll" @change="handleTreeNodeAll">全选/全不选</el-checkbox>
    <el-checkbox v-model="treeCheckStrictly">父子联动</el-checkbox>
    <el-tree ref="permTreeRef" :check-strictly="!treeCheckStrictly" show-checkbox
             :default-checked-keys="roleMenuData"
             :default-expand-all="true"
             :data="menuData"
             node-key="id"
             :props="{label: 'menuTitle'}"
             style="border: 1px solid  var(--el-border-color);border-radius: 2px">
    </el-tree>
    <template #footer class="dialog-footer">
      <el-button type="primary" @click="submitPermForm">确 定</el-button>
      <el-button @click="cancelPermForm">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {reactive, ref, unref} from "vue";
import {create, del, getPage, getById, update, getRoleMenus, saveRoleMenus} from "@/api/system/role.js"
import {getTree} from "@/api/system/menu.js"
import {ElMessage, ElMessageBox} from "element-plus";
import MiDictLabel from "@/components/dict/MiDictLabel.vue";
import router from "@/router/index.js";
import {flat} from "@/api/utils.js";

const queryRef = ref()
const formRef = ref()
const tableRef = ref()
const permTreeRef = ref()

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10
})

const rules = {
  roleName: [
    {required: true, message: "角色名称不能为空", trigger: "blur"},
  ],
  roleKey: [
    {required: true, message: "角色键名不能为空", trigger: "blur"},
    {pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: "只能包含字母、数字、下划线、中划线，且字母开头", trigger: "blur"},
    {min: 2, max: 30, message: "长度 2 - 30 个字符", trigger: "blur"},
  ]
}

const formData = ref({})
const formDialog = reactive({
  title: null,
  open: false
})

const tableData = ref({
  list: [],
  total: 0
})

const permDialog = reactive({
  open: false
})

const menuData = ref([])
const roleMenuData = ref([])
const roleIdForMenu = ref(null)
const treeExpand = ref(false)
const treeNodeAll = ref(false)
const treeCheckStrictly = ref(false)
handleQuery()

// ---------------------- Functions ---------------------------

function handleQuery() {
  getPage(queryParams).then(res => {
    tableData.value = res.data
  })
}

function resetQuery(formEl) {
  if (!formEl) return
  formEl.resetFields();
  handleQuery();
}

function handleUpdate(id) {
  if (id instanceof Event) {
    id = tableRef.value.getSelectionRows().map(it => it.id)
    if (id.length === 0 || id.length > 1) {
      ElMessage.warning('请选择一条记录')
      return
    }
    id = id[0]
  }

  resetForm()
  getById(id).then(res => {
    formData.value = res.data
  }).then(() => {
    formDialog.open = true
    formDialog.title = "修改角色"
  })
}

function handleDelete(id) {
  if (id instanceof Event) {
    id = tableRef.value.getSelectionRows().map(it => it.id)
    if (id.length === 0) {
      ElMessage.warning('请选择至少一条记录')
      return
    }
  }

  ElMessageBox.confirm('确认执行删除操作吗?', '系统提示', {
    cancelButtonText: '取消',
    confirmButtonText: '确认'
  })
      .then(() => {
        del(id).then(res => {
          ElMessage.success('操作成功')
          handleQuery()
        })
      })
}

function handleMember(id) {
  router.push("/system/role/member/" + id)
}

function handleAdd() {
  resetForm()
  formDialog.open = true
  formDialog.title = "新增角色"
}

function resetForm() {
  formData.value = {
    status: '0',
    orderNum: 0
  }
}

function submitForm(formEl) {
  formEl.validate(valid => {
    if (valid) {
      if (formData.value.id != null) {
        update(formData.value).then(res => {
          ElMessage.success('操作成功')
          formDialog.open = false
          handleQuery()
        })
      } else {
        create(formData.value).then(res => {
          ElMessage.success('操作成功')
          formDialog.open = false
          handleQuery()
        })
      }
    }
  })
}

function cancelForm() {
  formDialog.open = false
}

function handlePermission(id) {
  permDialog.open = true
  getTree({parentId: -1}).then(res => {
    menuData.value = res.data
  })
  treeCheckStrictly.value = false
  treeExpand.value = false
  treeNodeAll.value = false

  getRoleMenus(id).then(res => {
    roleMenuData.value = res.data.map(it => it.id)
  })
  roleIdForMenu.value = id
}

function cancelPermForm() {
  permDialog.open = false
}

function handleTreeExpand(value) {
  const length = flat(menuData.value).length
  const tree = unref(permTreeRef)
  const nodesMap = tree.store.nodesMap
  for (let i = 0; i < length; i++) {
    if (nodesMap[i]) nodesMap[i].expanded = value
  }
}

function handleTreeNodeAll(value) {
  if (value) {
    const id = flat(menuData.value).map(it => it.id)
    unref(permTreeRef).setCheckedKeys(id)
  } else {
    unref(permTreeRef).setCheckedKeys([])
  }
}

function submitPermForm() {
  const menuId = unref(permTreeRef).getCheckedKeys()
  saveRoleMenus(roleIdForMenu.value, menuId).then(res => {
    permDialog.open = false
    ElMessage.success('操作成功')
  })
}
</script>

<style scoped>
</style>