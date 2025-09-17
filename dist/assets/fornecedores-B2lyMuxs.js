import"./modulepreload-polyfill-B5Qt9EMX.js";import{p as h,r as E}from"./topBar-DJwU6RwO.js";const l="https://www.relda.com.br",w=JSON.parse(localStorage.getItem("userData"));let i=null,m=[];document.addEventListener("DOMContentLoaded",()=>{h("cadastros"),E("cadastros",w.permissions_list),u(),L()});function L(){const e=document.getElementById("search-input"),s=document.getElementById("status-filter"),a=document.getElementById("category-filter");e.addEventListener("keyup",r),s.addEventListener("change",r),a.addEventListener("change",r),document.getElementById("add-supplier-btn").addEventListener("click",()=>{window.location.href="../cadastros/fornecedores/cadastroFornecedores.html"}),document.getElementById("fab-add-supplier").addEventListener("click",()=>{window.location.href="../cadastros/fornecedores/cadastroFornecedores.html"}),document.getElementById("confirm-delete").addEventListener("click",b),document.getElementById("cancel-delete").addEventListener("click",x),document.getElementById("close-toast").addEventListener("click",()=>{document.getElementById("toast").classList.add("hidden")})}function r(){const e=document.getElementById("search-input").value.toLowerCase(),s=document.getElementById("status-filter").value.toLowerCase(),a=document.getElementById("category-filter").value;let t=m;if(e&&(t=t.filter(n=>n.name.toLowerCase().includes(e)||n.document.toLowerCase().includes(e))),s!=="todos"&&s!=="all"){const n=s==="ativo"?"active":"inactive";t=t.filter(o=>o.status===n)}a!=="Todas"&&a!=="all"&&(t=t.filter(n=>n.category===a)),f(t)}async function u(){try{const e=await fetch(`${l}/api/cadastros/suppliers/`,{credentials:"include"});if(e.status===401){window.location.href="../login.html";return}if(!e.ok)throw new Error("Falha ao carregar fornecedores.");const s=await e.json();m=s,f(s)}catch(e){d("Erro!",e.message,"error")}}function f(e){const s=document.querySelector("table tbody"),a=document.querySelector(".md\\:hidden.divide-y");if(s.innerHTML="",a.innerHTML="",document.getElementById("summary-total").textContent=e.length,document.getElementById("summary-active").textContent=e.filter(t=>t.status==="active").length,document.getElementById("summary-inactive").textContent=e.filter(t=>t.status==="inactive").length,e.length===0){s.innerHTML='<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum fornecedor cadastrado.</td></tr>',a.innerHTML='<p class="text-center py-4 text-gray-500">Nenhum fornecedor cadastrado.</p>';return}e.forEach(t=>{const n=(t.name.split(" ").map(v=>v[0]).join("")||"F").substring(0,2).toUpperCase(),o=t.status==="active"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800",c=t.status==="active"?"Ativo":"Inativo",g=`
                <button onclick="editSupplier(${t.id})" class="text-primary hover:text-blue-700 mr-3"><i class="fas fa-edit"></i></button>
                <button onclick="confirmDelete(${t.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash"></i></button>
            `,y=`
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">${n}</div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${t.name}</div>
                            <div class="text-sm text-gray-500">${t.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.document}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.category||"N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o}">${c}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${g}</td>
            `;s.innerHTML+=`<tr>${y}</tr>`;const p=`
                <div class="p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">${n}</div>
                        <div class="ml-4 flex-1">
                            <div class="flex justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${t.name}</p>
                                    <p class="text-xs text-gray-500">${t.document}</p>
                                </div>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o}">${c}</span>
                            </div>
                            <div class="mt-2">
                                <p class="text-xs text-gray-500"><i class="fas fa-phone mr-1"></i> ${t.phone}</p>
                                <p class="text-xs text-gray-500"><i class="fas fa-envelope mr-1"></i> ${t.email}</p>
                                <p class="text-xs text-gray-500"><i class="fas fa-tag mr-1"></i> ${t.category||"N/A"}</p>
                            </div>
                            <div class="mt-2 flex justify-end space-x-3">
                                <button onclick="editSupplier(${t.id})" class="text-primary hover:text-blue-700"><i class="fas fa-edit"></i> Editar</button>
                                <button onclick="confirmDelete(${t.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash"></i> Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;a.innerHTML+=p})}function x(){i=null,document.getElementById("delete-modal").classList.add("hidden")}async function b(){if(i)try{if((await fetch(`${l}/api/cadastros/suppliers/${i}/`,{method:"DELETE",credentials:"include"})).status!==204)throw new Error("Falha ao excluir fornecedor.");d("Sucesso!","Fornecedor excluído com sucesso.","success"),u()}catch(e){d("Erro!",e.message,"error")}finally{x()}}function d(e,s,a){const t=document.getElementById("toast"),n=document.getElementById("toast-title"),o=document.getElementById("toast-message"),c=document.getElementById("toast-icon");n.textContent=e,o.textContent=s,a==="success"?c.innerHTML='<i class="fas fa-check-circle text-green-500"></i>':a==="error"&&(c.innerHTML='<i class="fas fa-exclamation-circle text-red-500"></i>'),t.classList.remove("hidden"),setTimeout(()=>{t.classList.add("hidden")},5e3)}
